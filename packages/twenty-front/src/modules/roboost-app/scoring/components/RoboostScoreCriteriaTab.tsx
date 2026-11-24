import { useRoboostScoreEditor } from '@/roboost-app/scoring/components/RoboostScoreEditorContext';
import { RoboostScoreGroupCard } from '@/roboost-app/scoring/components/RoboostScoreGroupCard';
import {
  addRoboostScoreGroup,
  setAllRoboostScoreCollapsed,
} from '@/roboost-app/scoring/utils/roboostScoreCriteriaUpdates';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Select } from '@/roboost-ui/components/Select';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import {
  ROBOOST_SCORE_LIMIT_OPTIONS,
  type RoboostScoreCriteria,
} from 'twenty-shared/utils';

type RoboostScoreCriteriaTabProps = {
  draft: RoboostScoreCriteria;
};

const formatNumber = (value: number) =>
  value.toLocaleString('en-US', { maximumFractionDigits: 1 });

const limitKey = ({ min, max }: { min: number; max: number }) =>
  `${min}|${max}`;

export const RoboostScoreCriteriaTab = ({
  draft,
}: RoboostScoreCriteriaTabProps) => {
  const { t } = useLingui();
  const { canEdit, validation, updateDraft } = useRoboostScoreEditor();
  const maxPossible = formatNumber(validation.maxPossible);
  const sumOfLimits = formatNumber(validation.sumOfLimits);
  const scoreMax = formatNumber(draft.scoreMax);

  return (
    <div className="rb-sce-criteria">
      <div className="rb-sce-limits">
        <span className="rb-sce-limits-label">{t`Score limits`}</span>
        <div className={cx('rb-sce-limits-select', !canEdit && 'is-readonly')}>
          <Select
            aria-label={t`Score limits`}
            value={limitKey({ min: draft.scoreMin, max: draft.scoreMax })}
            options={ROBOOST_SCORE_LIMIT_OPTIONS.map((option) => ({
              value: limitKey(option),
              label: `${option.min.toLocaleString('en-US')} ${t`to`} ${option.max.toLocaleString('en-US')}`,
            }))}
            onChange={(value) => {
              const [min, max] = value.split('|').map(Number);

              updateDraft((criteria) => ({
                ...criteria,
                scoreMin: min,
                scoreMax: max,
              }));
            }}
          />
        </div>
        <span className="rb-sce-divider" />
        <span
          className={cx(
            'rb-sce-maxpossible',
            validation.isMaxPossibleOverScoreMax && 'is-over',
          )}
          title={t`The sum of every group's highest reachable points`}
        >
          {t`Max possible:`} <strong>{maxPossible}</strong>
        </span>
        <span className="rb-sp" />
        <Button
          variant="secondary"
          size="sm"
          icon="maximize"
          onClick={() =>
            updateDraft((criteria) =>
              setAllRoboostScoreCollapsed(criteria, false),
            )
          }
        >
          {t`Expand all`}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon="minimize"
          onClick={() =>
            updateDraft((criteria) =>
              setAllRoboostScoreCollapsed(criteria, true),
            )
          }
        >
          {t`Collapse all`}
        </Button>
      </div>
      {validation.isMaxPossibleOverScoreMax && (
        <div className="rb-sc-inline-note">
          <Icon name="info" size={13} />
          {t`The groups can reach ${maxPossible} points; totals above ${scoreMax} are capped at ${scoreMax}.`}
        </div>
      )}
      {validation.isSumOfLimitsOverScoreMax && (
        <div className="rb-sc-inline-warning">
          <Icon name="alert-triangle" size={13} />
          {t`The group limits add up to ${sumOfLimits}, more than the score maximum of ${scoreMax}.`}
        </div>
      )}
      {draft.groups.map((group) => (
        <RoboostScoreGroupCard key={group.id} group={group} />
      ))}
      {canEdit && (
        <div>
          <button
            type="button"
            className="rb-hbtn rb-hbtn-accent"
            onClick={() =>
              updateDraft((criteria) =>
                addRoboostScoreGroup(criteria, t`New scoring group`),
              )
            }
          >
            <Icon name="plus" size={14} strokeWidth={2} />
            {t`Add group`}
          </button>
        </div>
      )}
    </div>
  );
};
