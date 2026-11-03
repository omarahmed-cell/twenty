import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type FieldMetadataFormulaSettings } from 'twenty-shared/types';
import {
  type ComputedGraphField,
  findComputedFieldCycleMembers,
  isDefined,
  parseFormula,
} from 'twenty-shared/utils';
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
      !FIELD_TYPES_WITHOUT_A_VALUE.includes(field.type),
  );

export const getComputedGraphFields = (
  objectMetadataItems: EnrichedObjectMetadataItem[],
): (ComputedGraphField & Pick<FieldMetadataItem, 'label'>)[] =>
  objectMetadataItems.flatMap(({ id: objectMetadataId, fields }) =>
    fields.map(({ id, name, label, type, isActive, settings }) => ({
      id,
      name,
      label,
      type,
      isActive,
      settings,
      objectMetadataId,
    })),
  );

// The result of saving these settings on this field, to catch a loop before it exists.
export const getLoopFieldLabels = (
  objectMetadataItems: EnrichedObjectMetadataItem[],
  targetFieldId: string,
  settings: unknown,
): string[] => {
  const fields = getComputedGraphFields(objectMetadataItems).map((field) =>
    field.id === targetFieldId ? { ...field, settings } : field,
  );

  const members = findComputedFieldCycleMembers(fields);

  return members.has(targetFieldId)
    ? fields.filter(({ id }) => members.has(id)).map(({ label }) => label)
    : [];
};

export type FormulaValidation =
  | { status: 'valid'; dependencies: FieldMetadataItem[] }
  | { status: 'invalid'; error: string };

export const validateFormula = ({
  expression,
  objectMetadataItem,
  objectMetadataItems,
  targetField,
}: {
  expression: string;
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  targetField?: FieldMetadataItem;
}): FormulaValidation => {
  const parsedFormula = parseFormula(expression);

  if (parsedFormula.status === 'invalid') {
    return parsedFormula;
  }

  if (
    isDefined(targetField) &&
    parsedFormula.fieldNames.includes(targetField.name)
  ) {
    return { status: 'invalid', error: 'A formula cannot use its own field.' };
  }

  const referenceableFields = getFormulaReferenceableFields(
    objectMetadataItem,
    targetField?.id,
  );

  const unknownFieldName = parsedFormula.fieldNames.find(
    (fieldName) => !referenceableFields.some(({ name }) => name === fieldName),
  );

  if (isDefined(unknownFieldName)) {
    return {
      status: 'invalid',
      error: `"${unknownFieldName}" is not a field this formula can use.`,
    };
  }

  // A brand new field cannot be in a loop, since nothing references it yet.
  if (isDefined(targetField)) {
    const loopFieldLabels = getLoopFieldLabels(
      objectMetadataItems,
      targetField.id,
      { ...targetField.settings, formula: { expression } },
    );

    if (loopFieldLabels.length > 0) {
      return {
        status: 'invalid',
        error: `This would create a loop between: ${loopFieldLabels.join(', ')}.`,
      };
    }
  }

  return {
    status: 'valid',
    dependencies: referenceableFields.filter(({ name }) =>
      parsedFormula.fieldNames.includes(name),
    ),
  };
};
