import { RoboostFilterRuleValueInput } from '@/roboost-app/filters/components/RoboostFilterRuleValueInput';
import { ROBOOST_FILTER_OPERATOR_LABELS } from '@/roboost-app/filters/constants/RoboostFilterOperatorLabels';
import { type RoboostFilterRule } from '@/roboost-app/list/types/RoboostListFilters';
import { useRoboostScoreEditor } from '@/roboost-app/scoring/components/RoboostScoreEditorContext';
import { formatRoboostScoreFieldValue } from '@/roboost-app/scoring/utils/formatRoboostScoreFieldValue';
import { Button } from '@/roboost-ui/components/Button';
import { Select } from '@/roboost-ui/components/Select';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import {
  getRoboostFilterFieldKind,
  isDefined,
  isRoboostScoreConditionComplete,
  ROBOOST_FILTER_OPERATORS_BY_KIND,
  type RoboostFilterOperator,
  type RoboostScoreCondition,
} from 'twenty-shared/utils';

type RoboostScoreConditionRowProps = {
  condition: RoboostScoreCondition;
  isFirst: boolean;
  onChange: (condition: RoboostScoreCondition) => void;
  onRemove: () => void;
};

export const RoboostScoreConditionRow = ({
  condition,
  isFirst,
  onChange,
  onRemove,
}: RoboostScoreConditionRowProps) => {
  const { t, i18n } = useLingui();
  const { fieldOptions, fieldsByName, canEdit, testResult, memberLabels } =
    useRoboostScoreEditor();
  const field = isDefined(condition.fieldName)
    ? fieldsByName.get(condition.fieldName)
    : undefined;
  const kind = isDefined(field) ? getRoboostFilterFieldKind(field) : null;
  const operators = isDefined(kind)
    ? ROBOOST_FILTER_OPERATORS_BY_KIND[kind]
    : [];
  const isComplete = isRoboostScoreConditionComplete(condition);
  const rule: RoboostFilterRule = {
    id: condition.id,
    fieldName: condition.fieldName ?? '',
    operator: condition.operand ?? 'isKnown',
    value: condition.value,
    labels: condition.labels,
  };

  return (
    <div className={cx('rb-scr-cond', !isComplete && 'is-incomplete')}>
      <span className="rb-scr-and">{isFirst ? '' : t`and`}</span>
      <div className={cx('rb-scr-cond-fields', !canEdit && 'is-readonly')}>
        <Select
          aria-label={t`Property`}
          className="rb-scr-prop"
          placeholder={t`Select a property`}
          isSearchable
          value={condition.fieldName ?? ''}
          options={fieldOptions}
          onChange={(fieldName) => {
            const nextField = fieldsByName.get(fieldName);
            const nextKind = isDefined(nextField)
              ? getRoboostFilterFieldKind(nextField)
              : null;

            onChange({
              ...condition,
              fieldName,
              operand: isDefined(nextKind)
                ? ROBOOST_FILTER_OPERATORS_BY_KIND[nextKind][0]
                : null,
              value: null,
              labels: undefined,
            });
          }}
        />
        {isDefined(field) && (
          <Select
            aria-label={t`Operator`}
            className="rb-scr-op"
            value={condition.operand ?? ''}
            options={operators.map((operator) => ({
              value: operator,
              label: i18n._(ROBOOST_FILTER_OPERATOR_LABELS[operator]),
            }))}
            onChange={(operand) =>
              onChange({
                ...condition,
                operand: operand as RoboostFilterOperator,
              })
            }
          />
        )}
        {isDefined(field) && (
          <div className="rb-scr-value">
            <RoboostFilterRuleValueInput
              field={field}
              rule={rule}
              onChange={(nextRule) =>
                onChange({
                  ...condition,
                  value: Array.isArray(nextRule.value)
                    ? nextRule.value
                    : isDefined(nextRule.value)
                      ? [nextRule.value]
                      : null,
                  labels: nextRule.labels,
                })
              }
            />
          </div>
        )}
        {isDefined(field) && isDefined(testResult) && (
          <span className="rb-scr-current">
            {t`Current value:`}{' '}
            <strong>
              {formatRoboostScoreFieldValue({
                field,
                record: testResult.record,
                labelsById: { ...memberLabels, ...condition.labels },
                yesLabel: t`Yes`,
                noLabel: t`No`,
              })}
            </strong>
          </span>
        )}
      </div>
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          icon="x"
          aria-label={t`Remove condition`}
          onClick={onRemove}
        />
      )}
    </div>
  );
};
