import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { RoboostRecordPicker } from '@/roboost-app/fields/RoboostRecordPicker';
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

type RoboostFilterRuleValueInputProps = {
  field: FieldMetadataItem | undefined;
  rule: RoboostFilterRule;
  onChange: (rule: RoboostFilterRule) => void;
};

const asList = (value: RoboostFilterRule['value']) =>
  Array.isArray(value) ? value : isString(value) && value !== '' ? [value] : [];

// The value box of a filter rule, by field type; shared by advanced filters and scores
export const RoboostFilterRuleValueInput = ({
  field,
  rule,
  onChange,
}: RoboostFilterRuleValueInputProps) => {
  const { t } = useLingui();
  const kind = isDefined(field) ? getRoboostFilterFieldKind(field) : null;
  const values = asList(rule.value);

  const setValues = (nextValues: string[]) =>
    onChange({ ...rule, value: nextValues });

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
