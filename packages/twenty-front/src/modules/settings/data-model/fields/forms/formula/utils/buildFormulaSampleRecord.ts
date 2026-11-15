import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { generateEmptyFieldValue } from '@/object-record/utils/generateEmptyFieldValue';
import { isNonEmptyString } from '@sniptt/guards';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const MICROS_PER_UNIT = 1_000_000;

export type FormulaSampleInputValue = string | string[];

// Keyed by field name, or "field.subField" for composite fields.
export type FormulaSampleInputs = Record<string, FormulaSampleInputValue>;

export type FormulaSampleField = Pick<
  FieldMetadataItem,
  'name' | 'type' | 'settings' | 'defaultValue'
>;

export const FORMULA_SAMPLE_SUB_FIELDS: Partial<
  Record<FieldMetadataType, { all: string[]; defaults: string[] }>
> = {
  [FieldMetadataType.LINKS]: {
    all: ['primaryLinkUrl', 'primaryLinkLabel'],
    defaults: ['primaryLinkUrl'],
  },
  [FieldMetadataType.PHONES]: {
    all: [
      'primaryPhoneNumber',
      'primaryPhoneCountryCode',
      'primaryPhoneCallingCode',
    ],
    defaults: ['primaryPhoneNumber'],
  },
  [FieldMetadataType.EMAILS]: {
    all: ['primaryEmail'],
    defaults: ['primaryEmail'],
  },
  [FieldMetadataType.ADDRESS]: {
    all: [
      'addressStreet1',
      'addressStreet2',
      'addressCity',
      'addressState',
      'addressPostcode',
      'addressCountry',
    ],
    defaults: ['addressCity', 'addressCountry'],
  },
  [FieldMetadataType.FULL_NAME]: {
    all: ['firstName', 'lastName'],
    defaults: ['firstName', 'lastName'],
  },
};

export const getFormulaSampleSubFields = (
  expression: string,
  field: Pick<FieldMetadataItem, 'name' | 'type'>,
) => {
  const subFields = FORMULA_SAMPLE_SUB_FIELDS[field.type];

  if (subFields === undefined) {
    return [];
  }

  const usedSubFields = [
    ...expression.matchAll(new RegExp(`\\b${field.name}\\.(\\w+)`, 'g')),
  ]
    .map(([, subField]) => subField)
    .filter((subField) => subFields.all.includes(subField));

  return usedSubFields.length > 0
    ? [...new Set(usedSubFields)]
    : subFields.defaults;
};

const getText = (value: FormulaSampleInputValue | undefined) =>
  typeof value === 'string' ? value : '';

const toNumberOrNull = (text: string) => {
  if (!isNonEmptyString(text.trim())) {
    return null;
  }

  const number = Number(text);

  return Number.isNaN(number) ? null : number;
};

const toSampleValue = (
  field: FormulaSampleField,
  inputs: FormulaSampleInputs,
  expression: string,
) => {
  const input = inputs[field.name];
  const text = getText(input);

  switch (field.type) {
    case FieldMetadataType.MULTI_SELECT:
      return Array.isArray(input) && input.length > 0 ? input : null;
    case FieldMetadataType.NUMBER:
    case FieldMetadataType.NUMERIC:
      return toNumberOrNull(text);
    case FieldMetadataType.BOOLEAN:
      return text === '' ? null : text === 'true';
    case FieldMetadataType.SELECT:
    case FieldMetadataType.DATE:
      return isNonEmptyString(text) ? text : null;
    case FieldMetadataType.DATE_TIME: {
      const date = new Date(text);

      return isNonEmptyString(text) && !Number.isNaN(date.getTime())
        ? date.toISOString()
        : null;
    }
    case FieldMetadataType.CURRENCY: {
      const amount = toNumberOrNull(getText(inputs[`${field.name}.amount`]));
      const currencyCode = getText(inputs[`${field.name}.currencyCode`]);

      return {
        amountMicros:
          amount === null ? null : Math.round(amount * MICROS_PER_UNIT),
        currencyCode: isNonEmptyString(currencyCode) ? currencyCode : null,
      };
    }
    default: {
      if (FORMULA_SAMPLE_SUB_FIELDS[field.type] === undefined) {
        return isNonEmptyString(text) ? text : null;
      }

      const emptyValue = generateEmptyFieldValue({
        fieldMetadataItem: field,
      }) as Record<string, unknown>;

      return Object.fromEntries([
        ...Object.entries(emptyValue),
        ...getFormulaSampleSubFields(expression, field).map((subField) => [
          subField,
          getText(inputs[`${field.name}.${subField}`]),
        ]),
      ]);
    }
  }
};

// Same shape as a record from the API, so buildFormulaVariables treats both alike.
export const buildFormulaSampleRecord = (
  fields: FormulaSampleField[],
  inputs: FormulaSampleInputs,
  expression: string,
): Record<string, unknown> =>
  Object.fromEntries(
    fields.map((field) => [
      field.name,
      toSampleValue(field, inputs, expression),
    ]),
  );
