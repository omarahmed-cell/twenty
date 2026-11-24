import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { RoboostRecordPicker } from '@/roboost-app/fields/RoboostRecordPicker';
import { ROBOOST_FILTER_OPERATOR_LABELS } from '@/roboost-app/filters/constants/RoboostFilterOperatorLabels';
import { ROBOOST_FILTER_OPERATORS_BY_KIND } from '@/roboost-app/filters/constants/RoboostFilterOperatorsByKind';
import { getRoboostFilterFieldKind } from '@/roboost-app/filters/utils/getRoboostFilterFieldKind';
import { isRoboostValuelessFilterOperator } from '@/roboost-app/filters/utils/isRoboostValuelessFilterOperator';
import { type RoboostFilterRule } from '@/roboost-app/list/types/RoboostListFilters';
import { isRoboostPercentageField } from '@/roboost-app/utils/formatRoboostPercentage';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { MultiSelect } from '@/roboost-ui/components/MultiSelect';
import { Select } from '@/roboost-ui/components/Select';
import { useLingui } from '@lingui/react/macro';
import { isString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

type RoboostFilterRuleEditorProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  rule: RoboostFilterRule;
  onChange: (rule: RoboostFilterRule) => void;
  onRemove: () => void;
};

// Record dates are system fields but are the most common filters (HubSpot's Create date)
const FILTERABLE_SYSTEM_FIELD_NAMES = new Set(['createdAt', 'updatedAt']);

const asList = (value: RoboostFilterRule['value']) =>
  Array.isArray(value) ? value : isString(value) && value !== '' ? [value] : [];

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
}: RoboostFilterRuleEditorProps) => {
  const { t, i18n } = useLingui();
  const fields = getRoboostFilterableFields(objectMetadataItem);
  const field = fields.find((candidate) => candidate.name === rule.fieldName);
  const kind = isDefined(field) ? getRoboostFilterFieldKind(field) : null;
  const operators = isDefined(kind)
    ? ROBOOST_FILTER_OPERATORS_BY_KIND[kind]
    : [];
  const values = asList(rule.value);

  const setValues = (nextValues: string[]) =>
    onChange({ ...rule, value: nextValues });

  const renderValue = () => {
    if (!isDefined(field) || isRoboostValuelessFilterOperator(rule.operator)) {
      return null;
    }

    switch (kind) {
      case 'select':
      case 'multiSelect': {
        const options = [...(field.options ?? [])].sort(
          (first, second) => first.position - second.position,
        );

        return (
          <MultiSelect
            aria-label={t`Values`}
            className="rb-frule-values"
            value={values}
            placeholder={t`Choose values`}
            options={options.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            onChange={setValues}
          />
        );
      }
      case 'boolean':
        return (
          <Select
            aria-label={t`Value`}
            value={values[0] ?? ''}
            placeholder={t`Choose`}
            options={[
              { value: 'true', label: t`Yes` },
              { value: 'false', label: t`No` },
            ]}
            onChange={(value) => setValues([value])}
          />
        );
      case 'relation':
        return (
          <div className="rb-frule-relation">
            {values.map((id) => (
              <span key={id} className="rb-tag">
                {rule.labels?.[id] ?? id.slice(0, 8)}
                <button
                  type="button"
                  className="rb-rve-tag-x"
                  aria-label={t`Remove`}
                  onClick={() =>
                    setValues(values.filter((value) => value !== id))
                  }
                >
                  <Icon name="x" size={12} />
                </button>
              </span>
            ))}
            <RoboostRecordPicker
              objectNameSingular={
                field.relation?.targetObjectMetadata.nameSingular ?? ''
              }
              selectedLabel=""
              placeholder={t`Add a value`}
              isClearable={false}
              onSelect={(record) => {
                if (isDefined(record) && !values.includes(record.id)) {
                  onChange({
                    ...rule,
                    value: [...values, record.id],
                    labels: { ...rule.labels, [record.id]: record.label },
                  });
                }
              }}
            />
          </div>
        );
      case 'date': {
        if (
          rule.operator === 'isMoreThanDaysAgo' ||
          rule.operator === 'isLessThanDaysAgo' ||
          rule.operator === 'isMoreThanDaysFromNow' ||
          rule.operator === 'isLessThanDaysFromNow'
        ) {
          return (
            <Input
              type="number"
              size="sm"
              aria-label={t`Days`}
              placeholder={t`Number of days`}
              value={values[0] ?? ''}
              onChange={(event) => setValues([event.target.value])}
            />
          );
        }

        return (
          <div className="rb-frule-range">
            <Input
              type="date"
              size="sm"
              aria-label={t`Date`}
              value={values[0] ?? ''}
              onChange={(event) =>
                setValues([event.target.value, values[1] ?? ''])
              }
            />
            {rule.operator === 'isBetween' && (
              <>
                <span>{t`and`}</span>
                <Input
                  type="date"
                  size="sm"
                  aria-label={t`End date`}
                  value={values[1] ?? ''}
                  onChange={(event) =>
                    setValues([values[0] ?? '', event.target.value])
                  }
                />
              </>
            )}
          </div>
        );
      }
      case 'number':
      case 'currency': {
        // Percentage fields are typed as % and kept as fractions, which is how they are stored
        const isPercent = kind === 'number' && isRoboostPercentageField(field);
        const shown = (stored: string | undefined) =>
          !isPercent || stored === undefined || stored === ''
            ? (stored ?? '')
            : String(Number((Number(stored) * 100).toFixed(4)));
        const stored = (typed: string) =>
          !isPercent || typed === '' ? typed : String(Number(typed) / 100);
        const suffix = isPercent && <span className="rb-frule-suffix">%</span>;

        return (
          <div className="rb-frule-range">
            <Input
              type="number"
              size="sm"
              aria-label={t`Value`}
              value={shown(values[0])}
              onChange={(event) =>
                setValues([stored(event.target.value), values[1] ?? ''])
              }
            />
            {suffix}
            {(rule.operator === 'isBetween' ||
              rule.operator === 'isNotBetween') && (
              <>
                <span>{t`and`}</span>
                <Input
                  type="number"
                  size="sm"
                  aria-label={t`Second value`}
                  value={shown(values[1])}
                  onChange={(event) =>
                    setValues([values[0] ?? '', stored(event.target.value)])
                  }
                />
                {suffix}
              </>
            )}
          </div>
        );
      }
      default:
        return (
          <Input
            size="sm"
            aria-label={t`Values`}
            placeholder={t`Values, separated by commas`}
            value={values.join(', ')}
            onChange={(event) =>
              setValues(
                event.target.value.split(',').map((value) => value.trimStart()),
              )
            }
          />
        );
    }
  };

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
          {renderValue()}
        </>
      )}
    </div>
  );
};
