import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostFilterFieldKind } from '@/roboost-app/filters/utils/getRoboostFilterFieldKind';
import {
  formatRoboostPercentage,
  isRoboostPercentageField,
} from '@/roboost-app/utils/formatRoboostPercentage';
import { isNonEmptyString, isNumber, isObject } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

const EMPTY = '—';

// The record's value as the tester reads it next to a condition
export const formatRoboostScoreFieldValue = ({
  field,
  record,
  labelsById = {},
  yesLabel,
  noLabel,
}: {
  field: FieldMetadataItem;
  record: Record<string, unknown>;
  labelsById?: Record<string, string>;
  yesLabel: string;
  noLabel: string;
}): string => {
  const kind = getRoboostFilterFieldKind(field);
  const value = record[field.name];

  switch (kind) {
    case 'relation': {
      const id = record[`${field.name}Id`];

      return isNonEmptyString(id) ? (labelsById[id] ?? id.slice(0, 8)) : EMPTY;
    }
    case 'boolean':
      return value === true ? yesLabel : value === false ? noLabel : EMPTY;
    case 'select': {
      const option = field.options?.find((item) => item.value === value);

      return option?.label ?? (isNonEmptyString(value) ? value : EMPTY);
    }
    case 'multiSelect': {
      const values = Array.isArray(value) ? value : [];

      return values.length === 0
        ? EMPTY
        : values
            .map(
              (item) =>
                field.options?.find((option) => option.value === item)?.label ??
                String(item),
            )
            .join(', ');
    }
    case 'currency': {
      const amount = isObject(value)
        ? (value as { amountMicros?: unknown; currencyCode?: unknown })
        : undefined;
      const micros = Number(amount?.amountMicros);

      return amount?.amountMicros === null ||
        amount?.amountMicros === undefined ||
        Number.isNaN(micros)
        ? EMPTY
        : `${(micros / 1_000_000).toLocaleString('en-US')} ${String(amount.currencyCode ?? '')}`.trim();
    }
    case 'number': {
      const number = Number(value);

      if (value === null || value === undefined || Number.isNaN(number)) {
        return EMPTY;
      }

      return isRoboostPercentageField(field)
        ? formatRoboostPercentage(number)
        : number.toLocaleString('en-US');
    }
    case 'date':
      return isNonEmptyString(value)
        ? field.type === 'DATE'
          ? value.slice(0, 10)
          : new Date(value).toLocaleString('en-GB', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
        : EMPTY;
    default: {
      if (isNonEmptyString(value) || isNumber(value)) {
        return String(value);
      }
      if (isObject(value)) {
        const parts = Object.values(value as Record<string, unknown>).filter(
          (part) => isNonEmptyString(part),
        );

        return parts.length > 0 ? parts.join(' ') : EMPTY;
      }

      return isDefined(value) ? String(value) : EMPTY;
    }
  }
};
