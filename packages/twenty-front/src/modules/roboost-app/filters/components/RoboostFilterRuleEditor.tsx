import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { RoboostFilterRuleValueInput } from '@/roboost-app/filters/components/RoboostFilterRuleValueInput';
import { ROBOOST_FILTER_OPERATOR_LABELS } from '@/roboost-app/filters/constants/RoboostFilterOperatorLabels';
import { ROBOOST_FILTER_OPERATORS_BY_KIND } from '@/roboost-app/filters/constants/RoboostFilterOperatorsByKind';
import { getRoboostFilterFieldKind } from '@/roboost-app/filters/utils/getRoboostFilterFieldKind';
import { type RoboostFilterRule } from '@/roboost-app/list/types/RoboostListFilters';
import { Icon } from '@/roboost-ui/components/Icon';
import { Select } from '@/roboost-ui/components/Select';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';

type RoboostFilterRuleEditorProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  rule: RoboostFilterRule;
  onChange: (rule: RoboostFilterRule) => void;
  onRemove: () => void;
  canPickTeams?: boolean;
};

// Record dates are system fields but are the most common filters (HubSpot's Create date)
const FILTERABLE_SYSTEM_FIELD_NAMES = new Set(['createdAt', 'updatedAt']);

export const getRoboostFilterableFields = (
  objectMetadataItem: EnrichedObjectMetadataItem,
) =>
  objectMetadataItem.fields
    .filter(
      (field) =>
        field.isActive &&
        (field.isSystem !== true ||
          FILTERABLE_SYSTEM_FIELD_NAMES.has(field.name)) &&
        getRoboostFilterFieldKind(field) !== null,
    )
    .sort((first, second) => first.label.localeCompare(second.label));

export const RoboostFilterRuleEditor = ({
  objectMetadataItem,
  rule,
  onChange,
  onRemove,
  canPickTeams = false,
}: RoboostFilterRuleEditorProps) => {
  const { t, i18n } = useLingui();
  const fields = getRoboostFilterableFields(objectMetadataItem);
  const field = fields.find((candidate) => candidate.name === rule.fieldName);
  const kind = isDefined(field) ? getRoboostFilterFieldKind(field) : null;
  const operators = isDefined(kind)
    ? ROBOOST_FILTER_OPERATORS_BY_KIND[kind]
    : [];
  return (
    <div className="rb-frule">
      <div className="rb-frule-head">
        <Select
          aria-label={t`Property`}
          className="rb-frule-field"
          placeholder={t`Choose a property`}
          value={rule.fieldName}
          options={fields.map((candidate) => ({
            value: candidate.name,
            label: candidate.label,
          }))}
          onChange={(fieldName) => {
            const nextField = fields.find(
              (candidate) => candidate.name === fieldName,
            );
            const nextKind = isDefined(nextField)
              ? getRoboostFilterFieldKind(nextField)
              : null;

            onChange({
              ...rule,
              fieldName,
              operator: isDefined(nextKind)
                ? ROBOOST_FILTER_OPERATORS_BY_KIND[nextKind][0]
                : rule.operator,
              value: null,
              labels: undefined,
            });
          }}
        />
        <button
          type="button"
          className="rb-rc-iconbtn"
          aria-label={t`Remove filter`}
          onClick={onRemove}
        >
          <Icon name="trash" size={14} />
        </button>
      </div>
      {isDefined(field) && (
        <>
          <Select
            aria-label={t`Operator`}
            value={rule.operator}
            options={operators.map((operator) => ({
              value: operator,
              label: i18n._(ROBOOST_FILTER_OPERATOR_LABELS[operator]),
            }))}
            onChange={(operator) =>
              onChange({
                ...rule,
                operator: operator as RoboostFilterRule['operator'],
              })
            }
          />
          <RoboostFilterRuleValueInput
            field={field}
            rule={rule}
            onChange={onChange}
            canPickTeams={canPickTeams}
          />
        </>
      )}
    </div>
  );
};
