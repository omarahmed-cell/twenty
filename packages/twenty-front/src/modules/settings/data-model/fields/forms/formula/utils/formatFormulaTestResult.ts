import { type DateFormat } from '@/localization/constants/DateFormat';
import { type NumberFormat } from '@/localization/constants/NumberFormat';
import { type TimeFormat } from '@/localization/constants/TimeFormat';
import {
  DEFAULT_DECIMAL_VALUE,
  formatNumber,
} from '@/localization/utils/formatNumber';
import { type FieldDateMetadataSettings } from '@/object-record/record-field/ui/types/FieldMetadata';
import { formatDateString } from '@/object-record/record-field/ui/utils/formatDateString';
import { formatDateTimeString } from '@/object-record/record-field/ui/utils/formatDateTimeString';
import { t } from '@lingui/core/macro';
import { doNotTranslate } from 'twenty-shared/i18n';
import { type Locale } from 'date-fns';
import {
  type DurationUnit,
  formatDuration,
  type FormulaOutputFieldType,
  type FormulaResultValue,
  formatToShortNumber,
  isDefined,
} from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const MICROS_PER_UNIT = 1_000_000;

export type FormulaTestResultSettings = {
  type?: string;
  decimals?: number;
  durationUnit?: DurationUnit;
  format?: string | null;
} & Partial<FieldDateMetadataSettings>;

export type FormulaTestResultFormatContext = {
  numberFormat: NumberFormat;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  timeZone: string;
  localeCatalog: Locale;
};

type FormatFormulaTestResultArgs = {
  value: FormulaResultValue;
  outputType: FormulaOutputFieldType;
  settings?: FormulaTestResultSettings | null;
  options?: { value: string; label: string }[];
  context: FormulaTestResultFormatContext;
};

// Mirrors the record page displays (NumberFieldDisplay, CurrencyDisplay, DateDisplay...).
export const formatFormulaTestResult = ({
  value,
  outputType,
  settings,
  options = [],
  context,
}: FormatFormulaTestResultArgs): string => {
  if (!isDefined(value)) {
    return '';
  }

  const decimals = settings?.decimals ?? DEFAULT_DECIMAL_VALUE;
  const format = (number: number) =>
    formatNumber(number, { format: context.numberFormat, decimals });

  switch (outputType) {
    case FieldMetadataType.NUMBER: {
      const number = Number(value);

      switch (settings?.type) {
        case 'percentage':
          return `${format(number * 100)}%`;
        case 'shortNumber':
          return formatToShortNumber(number);
        case 'unformatted':
          return String(number);
        case 'duration':
          return formatDuration(number, settings.durationUnit);
        default:
          return format(number);
      }
    }
    case FieldMetadataType.CURRENCY: {
      if (typeof value !== 'object') {
        return String(value);
      }

      const amount = value.amountMicros / MICROS_PER_UNIT;
      const formattedAmount =
        !isDefined(settings?.format) || settings.format === 'short'
          ? formatToShortNumber(amount)
          : format(amount);

      return `${formattedAmount} ${value.currencyCode}`;
    }
    case FieldMetadataType.DATE:
      return formatDateString({
        value: String(value),
        timeZone: doNotTranslate('UTC'),
        dateFormat: context.dateFormat,
        dateFieldSettings: settings as FieldDateMetadataSettings | undefined,
        localeCatalog: context.localeCatalog,
      });
    case FieldMetadataType.DATE_TIME:
      return formatDateTimeString({
        value: String(value),
        timeZone: context.timeZone,
        dateFormat: context.dateFormat,
        timeFormat: context.timeFormat,
        dateFieldSettings: settings as FieldDateMetadataSettings | undefined,
        localeCatalog: context.localeCatalog,
      });
    case FieldMetadataType.SELECT:
      return (
        options.find((option) => option.value === value)?.label ?? String(value)
      );
    case FieldMetadataType.BOOLEAN:
      return value === true ? t`Yes` : t`No`;
    default:
      return String(value);
  }
};
