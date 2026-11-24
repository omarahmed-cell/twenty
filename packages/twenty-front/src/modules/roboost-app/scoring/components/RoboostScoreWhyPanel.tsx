import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { ROBOOST_EXPLAIN_SCORE } from '@/roboost-app/scoring/graphql/roboostScoreQueries';
import {
  formatRoboostScorePoints,
  useDescribeRoboostScoreRuleSet,
} from '@/roboost-app/scoring/hooks/useDescribeRoboostScoreRuleSet';
import { useRoboostMemberLabels } from '@/roboost-app/scoring/hooks/useRoboostMemberLabels';
import { roboostScoreWhyState } from '@/roboost-app/scoring/states/roboostScoreWhyState';
import { type RoboostScoreExplanation } from '@/roboost-app/scoring/types/RoboostScore';
import { formatRoboostDateTime } from '@/roboost-app/utils/formatRoboostDateTime';
import { Icon } from '@/roboost-ui/components/Icon';
import { SidePanel } from '@/roboost-ui/components/SidePanel';
import { cx } from '@/roboost-ui/utils/cx';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';

const formatNumber = (value: number) =>
  value.toLocaleString('en-US', { maximumFractionDigits: 1 });

export const RoboostScoreWhyPanel = () => {
  const { t } = useLingui();
  const [roboostScoreWhy, setRoboostScoreWhy] =
    useAtomState(roboostScoreWhyState);
  const { objectMetadataItems } = useObjectMetadataItems();
  const memberLabels = useRoboostMemberLabels();
  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === roboostScoreWhy?.objectNameSingular,
  );
  const fieldsByName = new Map(
    (objectMetadataItem?.fields ?? []).map((field) => [field.name, field]),
  );
  const { describeRuleSet, valueLabel } = useDescribeRoboostScoreRuleSet(
    fieldsByName,
    memberLabels,
  );
  const { data, loading } = useQuery<{
    roboostExplainScore: RoboostScoreExplanation | null;
  }>(ROBOOST_EXPLAIN_SCORE, {
    variables: {
      fieldMetadataId: roboostScoreWhy?.fieldMetadataId,
      recordId: roboostScoreWhy?.recordId,
    },
    skip: !isDefined(roboostScoreWhy),
    fetchPolicy: 'network-only',
  });

  if (!isDefined(roboostScoreWhy)) {
    return null;
  }
  const explanation = data?.roboostExplainScore ?? null;
  const breakdown = explanation?.breakdown ?? null;
  const criteria = explanation?.criteria ?? null;
  const ruleSetById = new Map(
    (criteria?.groups ?? []).flatMap((group) =>
      group.ruleSets.map((ruleSet) => [ruleSet.id, ruleSet] as const),
    ),
  );
  const versionNumber = explanation?.versionNumber ?? null;
  const scoreName = explanation?.scoreName ?? '';
  const valueText = isDefined(explanation?.value)
    ? formatNumber(explanation.value)
    : '—';

  return (
    <SidePanel
      title={t`Why this score?`}
      width={480}
      onClose={() => setRoboostScoreWhy(null)}
    >
      <div className="rb-scw">
        {loading && !isDefined(explanation) ? (
          <p className="rb-sc-hint">{t`Loading`}</p>
        ) : !isDefined(explanation) ? (
          <p className="rb-sc-hint">
            {t`This property is not linked to a score.`}
          </p>
        ) : (
          <>
            <div className="rb-scw-head">
              <div className="rb-scw-value">{valueText}</div>
              <div className="rb-scw-meta">
                <Link
                  className="rb-link"
                  to={`/scoring/${explanation.scoreId}`}
                  onClick={() => setRoboostScoreWhy(null)}
                >
                  {scoreName}
                </Link>
                {isDefined(versionNumber) && (
                  <span>{t`v${versionNumber}`}</span>
                )}
                {isDefined(explanation.computedAt) && (
                  <span>
                    {t`Calculated ${formatRoboostDateTime(explanation.computedAt)}`}
                  </span>
                )}
              </div>
            </div>
            {explanation.frozen && (
              <div className="rb-sc-inline-note">
                <Icon name="info" size={13} />
                {explanation.source === 'HUBSPOT_IMPORT'
                  ? t`Imported from HubSpot and frozen: this Closed Won deal keeps this score.`
                  : t`Frozen when the deal was Closed Won: later versions do not change it.`}
              </div>
            )}
            {!explanation.isActive && (
              <div className="rb-sc-inline-note">
                <Icon name="info" size={13} />
                {t`Score is off: this is the last value it calculated.`}
              </div>
            )}
            {!isDefined(breakdown) ? (
              <p className="rb-sc-hint">
                {t`This record has not been scored yet.`}
              </p>
            ) : (
              breakdown.groups.map((group) => {
                const trueRuleSets = group.ruleSets.filter(
                  (ruleSet) => ruleSet.matched,
                );
                const appliedText = formatNumber(group.applied);
                const rawText = formatNumber(group.raw);

                return (
                  <section key={group.id} className="rb-scw-group">
                    <div className="rb-scw-group-head">
                      <span className="rb-truncate">{group.name}</span>
                      <span className="rb-sp" />
                      <strong>
                        {group.raw !== group.applied
                          ? t`${appliedText} pts (raw ${rawText}, capped)`
                          : t`${appliedText} pts`}
                      </strong>
                    </div>
                    {trueRuleSets.length === 0 ? (
                      <p className="rb-sc-hint">{t`No rule set was true.`}</p>
                    ) : (
                      <ul className="rb-scw-rules">
                        {trueRuleSets.map((result) => {
                          const ruleSet = ruleSetById.get(result.id);
                          const field = fieldsByName.get(
                            ruleSet?.conditions[0]?.fieldName ?? '',
                          );

                          return (
                            <li key={result.id}>
                              <Icon
                                name="check"
                                size={13}
                                className="rb-scr-match"
                              />
                              <span className="rb-scw-rule">
                                {isDefined(ruleSet)
                                  ? describeRuleSet(ruleSet)
                                  : t`Rule set`}
                                {result.matchedValues.length > 0 &&
                                  isDefined(ruleSet) &&
                                  ` (${result.matchedValues
                                    .map((value) =>
                                      valueLabel(
                                        ruleSet.conditions[0],
                                        field,
                                        value,
                                      ),
                                    )
                                    .join(', ')})`}
                              </span>
                              <span
                                className={cx(
                                  'rb-scw-points',
                                  result.points < 0 && 'is-negative',
                                )}
                              >
                                {formatRoboostScorePoints(result.points)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                );
              })
            )}
            {isDefined(breakdown) && breakdown.rawTotal !== breakdown.total && (
              <p className="rb-sc-hint">
                {t`The groups add up to ${formatNumber(breakdown.rawTotal)}; the score limits keep it between ${breakdown.scoreMin} and ${breakdown.scoreMax}.`}
              </p>
            )}
          </>
        )}
      </div>
    </SidePanel>
  );
};
