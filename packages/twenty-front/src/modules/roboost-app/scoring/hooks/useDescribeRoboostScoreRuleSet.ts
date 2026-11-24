import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { ROBOOST_FILTER_OPERATOR_LABELS } from '@/roboost-app/filters/constants/RoboostFilterOperatorLabels';
import { useLingui } from '@lingui/react/macro';
import {
  isDefined,
  type RoboostScoreCondition,
  type RoboostScoreRuleSet,
} from 'twenty-shared/utils';

export const formatRoboostScorePoints = (points: number) =>
  `${points > 0 ? '+' : points < 0 ? '−' : ''}${Math.abs(points).toLocaleString('en-US', { maximumFractionDigits: 1 })}`;

// "Deal stage is any of Signed, Closing and Amount is more than 1000"
export const useDescribeRoboostScoreRuleSet = (
  fieldsByName: Map<string, FieldMetadataItem>,
  memberLabels: Record<string, string> = {},
) => {
  const { t, i18n } = useLingui();

  const valueLabel = (
    condition: RoboostScoreCondition,
    field: FieldMetadataItem | undefined,
    value: string,
  ) => {
    if (field?.type === 'BOOLEAN') {
      return value === 'true' ? t`Yes` : t`No`;
    }

    return (
      condition.labels?.[value] ??
      memberLabels[value] ??
      field?.options?.find((option) => option.value === value)?.label ??
      value
    );
  };

  const describeCondition = (condition: RoboostScoreCondition) => {
    const field = isDefined(condition.fieldName)
      ? fieldsByName.get(condition.fieldName)
      : undefined;
    const operatorLabel = isDefined(condition.operand)
      ? i18n._(ROBOOST_FILTER_OPERATOR_LABELS[condition.operand])
      : '';
    const values = (condition.value ?? [])
      .filter((value) => value !== '')
      .map((value) => valueLabel(condition, field, value))
      .join(', ');

    return [
      field?.label ?? condition.fieldName ?? t`Property`,
      operatorLabel,
      values,
    ]
      .filter((part) => part !== '')
      .join(' ');
  };

  const describeRuleSet = (ruleSet: RoboostScoreRuleSet) =>
    ruleSet.conditions.map(describeCondition).join(` ${t`and`} `);

  return { describeRuleSet, describeCondition, valueLabel };
};
