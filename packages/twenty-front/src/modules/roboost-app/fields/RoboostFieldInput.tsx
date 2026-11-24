import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostFieldEditKind } from '@/roboost-app/fields/getRoboostFieldEditKind';
import { getRoboostRecordLabel } from '@/roboost-app/fields/getRoboostRecordLabel';
import { RoboostInlineFieldDropdown } from '@/roboost-app/fields/RoboostInlineFieldDropdown';
import { RoboostRecordPicker } from '@/roboost-app/fields/RoboostRecordPicker';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Input } from '@/roboost-ui/components/Input';
import { MultiSelect } from '@/roboost-ui/components/MultiSelect';
import { Select } from '@/roboost-ui/components/Select';
import { useLingui } from '@lingui/react/macro';
import { isNumber, isString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

type CompositeValue = Record<string, unknown> | null | undefined;

export type RoboostFieldInputProps = {
  field: FieldMetadataItem;
  value: unknown;
  // For relations the record's related object, so the current label can be shown
  relatedRecord?: Record<string, unknown> | null;
  onChange: (
    value: unknown,
    relatedRecord?: { id: string; label: string } | null,
  ) => void;
  placeholder?: string;
  invalid?: boolean;
  // Opens the dropdown straight away when the editor appears (record properties, table cells)
  autoOpen?: boolean;
  // A dropdown closed without choosing (Cancel, Escape, click outside)
  onCancel?: () => void;
};

const toDateInput = (value: unknown, withTime: boolean) => {
  if (!isString(value) || value === '') {
    return '';
  }
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return withTime
    ? new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : value.slice(0, 10);
};

// One editor for create forms, table cells and record properties; it returns the API's input shape
export const RoboostFieldInput = ({
  field,
  value,
  relatedRecord,
  onChange,
  placeholder,
  invalid,
  autoOpen = false,
  onCancel,
}: RoboostFieldInputProps) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const kind = getRoboostFieldEditKind(field);
  const composite = value as CompositeValue;

  switch (kind) {
    case 'text':
      return (
        <Input
          value={isString(value) ? value : ''}
          placeholder={placeholder}
          invalid={invalid}
          aria-label={field.label}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'number':
      return (
        <Input
          type="number"
          value={isNumber(value) ? String(value) : ''}
          placeholder={placeholder}
          invalid={invalid}
          aria-label={field.label}
          onChange={(event) =>
            onChange(
              event.target.value === '' ? null : Number(event.target.value),
            )
          }
        />
      );
    case 'boolean':
      return (
        <Checkbox
          checked={value === true}
          aria-label={field.label}
          onChange={(checked) => onChange(checked)}
        >
          {value === true ? t`Yes` : t`No`}
        </Checkbox>
      );
    case 'select':
    case 'rating':
    case 'multiSelect': {
      const isMulti = kind === 'multiSelect';
      const options = [...(field.options ?? [])]
        .sort((first, second) => first.position - second.position)
        .map((option) => ({ value: option.value, label: option.label }));
      const selectedValues = isMulti
        ? Array.isArray(value)
          ? (value as string[])
          : []
        : isString(value) && value !== ''
          ? [value]
          : [];

      if (autoOpen) {
        return (
          <RoboostInlineFieldDropdown
            aria-label={field.label}
            options={options}
            mode={isMulti ? 'multi' : 'single'}
            selectedValues={selectedValues}
            onChange={onChange}
            onCancel={onCancel}
          />
        );
      }

      return isMulti ? (
        <MultiSelect
          aria-label={field.label}
          style={{ width: '100%' }}
          value={selectedValues}
          placeholder={placeholder ?? t`Select…`}
          options={options}
          onChange={onChange}
          onCancel={onCancel}
        />
      ) : (
        <Select
          aria-label={field.label}
          style={{ width: '100%' }}
          value={selectedValues[0] ?? ''}
          placeholder={placeholder ?? t`Select…`}
          options={options}
          isSearchable
          isClearable
          onChange={(nextValue) =>
            onChange(nextValue === '' ? null : nextValue)
          }
        />
      );
    }
    case 'date':
    case 'dateTime':
      return (
        <input
          className="rb-input"
          type={kind === 'date' ? 'date' : 'datetime-local'}
          aria-label={field.label}
          value={toDateInput(value, kind === 'dateTime')}
          onChange={(event) =>
            onChange(
              event.target.value === ''
                ? null
                : kind === 'date'
                  ? event.target.value
                  : new Date(event.target.value).toISOString(),
            )
          }
        />
      );
    case 'link':
      return (
        <Input
          value={
            isString(composite?.primaryLinkUrl) ? composite.primaryLinkUrl : ''
          }
          placeholder={placeholder ?? 'example.com'}
          invalid={invalid}
          aria-label={field.label}
          onChange={(event) =>
            onChange({
              primaryLinkUrl: event.target.value,
              primaryLinkLabel: composite?.primaryLinkLabel ?? '',
              secondaryLinks: composite?.secondaryLinks ?? null,
            })
          }
        />
      );
    case 'email':
      return (
        <Input
          type="email"
          value={
            isString(composite?.primaryEmail) ? composite.primaryEmail : ''
          }
          placeholder={placeholder ?? 'name@company.com'}
          invalid={invalid}
          aria-label={field.label}
          onChange={(event) =>
            onChange({
              primaryEmail: event.target.value,
              additionalEmails: composite?.additionalEmails ?? null,
            })
          }
        />
      );
    case 'phone':
      return (
        <div className="rb-inline-fields">
          <Input
            value={
              isString(composite?.primaryPhoneCallingCode)
                ? composite.primaryPhoneCallingCode
                : ''
            }
            placeholder="+966"
            aria-label={t`Calling code`}
            className="rb-input-narrow"
            onChange={(event) =>
              onChange({
                primaryPhoneNumber: composite?.primaryPhoneNumber ?? '',
                primaryPhoneCountryCode:
                  composite?.primaryPhoneCountryCode ?? '',
                primaryPhoneCallingCode: event.target.value,
                additionalPhones: composite?.additionalPhones ?? null,
              })
            }
          />
          <Input
            type="tel"
            value={
              isString(composite?.primaryPhoneNumber)
                ? composite.primaryPhoneNumber
                : ''
            }
            placeholder={placeholder}
            invalid={invalid}
            aria-label={field.label}
            onChange={(event) =>
              onChange({
                primaryPhoneNumber: event.target.value,
                primaryPhoneCountryCode:
                  composite?.primaryPhoneCountryCode ?? '',
                primaryPhoneCallingCode:
                  composite?.primaryPhoneCallingCode ?? '',
                additionalPhones: composite?.additionalPhones ?? null,
              })
            }
          />
        </div>
      );
    case 'currency': {
      const amountMicros = composite?.amountMicros;

      return (
        <div className="rb-inline-fields">
          <Input
            value={
              isString(composite?.currencyCode) ? composite.currencyCode : ''
            }
            placeholder="SAR"
            aria-label={t`Currency`}
            className="rb-input-narrow"
            onChange={(event) =>
              onChange({
                amountMicros: composite?.amountMicros ?? null,
                currencyCode: event.target.value.toUpperCase(),
              })
            }
          />
          <Input
            type="number"
            value={
              isNumber(amountMicros) ? String(amountMicros / 1_000_000) : ''
            }
            placeholder="0"
            invalid={invalid}
            aria-label={field.label}
            onChange={(event) =>
              onChange({
                amountMicros:
                  event.target.value === ''
                    ? null
                    : Math.round(Number(event.target.value) * 1_000_000),
                currencyCode: composite?.currencyCode ?? '',
              })
            }
          />
        </div>
      );
    }
    case 'fullName':
      return (
        <div className="rb-inline-fields">
          <Input
            value={isString(composite?.firstName) ? composite.firstName : ''}
            placeholder={t`First name`}
            invalid={invalid}
            aria-label={t`First name`}
            onChange={(event) =>
              onChange({
                firstName: event.target.value,
                lastName: composite?.lastName ?? '',
              })
            }
          />
          <Input
            value={isString(composite?.lastName) ? composite.lastName : ''}
            placeholder={t`Last name`}
            aria-label={t`Last name`}
            onChange={(event) =>
              onChange({
                firstName: composite?.firstName ?? '',
                lastName: event.target.value,
              })
            }
          />
        </div>
      );
    case 'relation': {
      const targetObjectNameSingular =
        field.relation?.targetObjectMetadata.nameSingular ?? '';
      const targetObjectMetadataItem = objectMetadataItems.find(
        (item) => item.nameSingular === targetObjectNameSingular,
      );

      return (
        <RoboostRecordPicker
          autoOpen={autoOpen}
          objectNameSingular={targetObjectNameSingular}
          selectedLabel={
            isDefined(relatedRecord)
              ? getRoboostRecordLabel(
                  relatedRecord as Record<string, unknown> & { id: string },
                  targetObjectMetadataItem,
                )
              : ''
          }
          placeholder={placeholder ?? t`No ${field.label.toLowerCase()}`}
          onSelect={(record) => onChange(record?.id ?? null, record)}
        />
      );
    }
    default:
      return null;
  }
};
