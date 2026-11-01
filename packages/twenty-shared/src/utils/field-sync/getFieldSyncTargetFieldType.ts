import { FieldMetadataType } from '@/types/FieldMetadataType';

const TEXT_MIRRORED_SOURCE_TYPES = new Set<FieldMetadataType>([
  FieldMetadataType.TEXT,
  FieldMetadataType.NUMBER,
  FieldMetadataType.NUMERIC,
  FieldMetadataType.RATING,
  FieldMetadataType.BOOLEAN,
  FieldMetadataType.DATE,
  FieldMetadataType.DATE_TIME,
  FieldMetadataType.UUID,
  FieldMetadataType.FULL_NAME,
  FieldMetadataType.EMAILS,
  FieldMetadataType.LINKS,
  FieldMetadataType.PHONES,
  FieldMetadataType.CURRENCY,
  FieldMetadataType.ADDRESS,
]);

export type FieldSyncTargetFieldType =
  | FieldMetadataType.SELECT
  | FieldMetadataType.MULTI_SELECT
  | FieldMetadataType.TEXT;

// Undefined means the source type cannot be synced.
export const getFieldSyncTargetFieldType = (
  sourceFieldType: FieldMetadataType,
): FieldSyncTargetFieldType | undefined => {
  if (
    sourceFieldType === FieldMetadataType.SELECT ||
    sourceFieldType === FieldMetadataType.MULTI_SELECT
  ) {
    return sourceFieldType;
  }

  return TEXT_MIRRORED_SOURCE_TYPES.has(sourceFieldType)
    ? FieldMetadataType.TEXT
    : undefined;
};
