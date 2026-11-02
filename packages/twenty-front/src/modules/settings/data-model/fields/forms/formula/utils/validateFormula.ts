import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type FieldMetadataFormulaSettings } from 'twenty-shared/types';
import { isDefined, parseFormula } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const FIELD_TYPES_WITHOUT_A_VALUE: FieldMetadataType[] = [
  FieldMetadataType.RELATION,
  FieldMetadataType.MORPH_RELATION,
  FieldMetadataType.TS_VECTOR,
];

export const getFieldFormulaSettings = (
  field: Pick<FieldMetadataItem, 'settings'> | undefined,
) =>
  (
    field?.settings as
      | { formula?: FieldMetadataFormulaSettings }
      | null
      | undefined
  )?.formula;

// Must stay in line with what the server accepts in resolveFieldFormulaConfigs.
export const getFormulaReferenceableFields = (
  objectMetadataItem: EnrichedObjectMetadataItem,
  targetFieldId?: string,
) =>
  objectMetadataItem.fields.filter(
    (field) =>
      field.isActive === true &&
      field.id !== targetFieldId &&
      field.name !== 'updatedAt' &&
      !FIELD_TYPES_WITHOUT_A_VALUE.includes(field.type) &&
      !isDefined(getFieldFormulaSettings(field)),
  );

export type FormulaValidation =
  | { status: 'valid'; dependencies: FieldMetadataItem[] }
  | { status: 'invalid'; error: string };

export const validateFormula = (
  expression: string,
  referenceableFields: FieldMetadataItem[],
): FormulaValidation => {
  const parsedFormula = parseFormula(expression);

  if (parsedFormula.status === 'invalid') {
    return parsedFormula;
  }

  const unknownFieldName = parsedFormula.fieldNames.find(
    (fieldName) => !referenceableFields.some(({ name }) => name === fieldName),
  );

  if (isDefined(unknownFieldName)) {
    return {
      status: 'invalid',
      error: `"${unknownFieldName}" is not a field this formula can use.`,
    };
  }

  return {
    status: 'valid',
    dependencies: referenceableFields.filter(({ name }) =>
      parsedFormula.fieldNames.includes(name),
    ),
  };
};
