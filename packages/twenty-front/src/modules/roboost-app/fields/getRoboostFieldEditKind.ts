import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

export type RoboostFieldEditKind =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiSelect'
  | 'date'
  | 'dateTime'
  | 'link'
  | 'email'
  | 'phone'
  | 'currency'
  | 'fullName'
  | 'relation'
  | 'rating';

const READ_ONLY_FIELD_NAMES = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'createdBy',
  'updatedBy',
  'position',
  'searchVector',
]);

const KIND_BY_TYPE: Partial<Record<FieldMetadataType, RoboostFieldEditKind>> = {
  [FieldMetadataType.TEXT]: 'text',
  [FieldMetadataType.NUMBER]: 'number',
  [FieldMetadataType.NUMERIC]: 'number',
  [FieldMetadataType.BOOLEAN]: 'boolean',
  [FieldMetadataType.SELECT]: 'select',
  [FieldMetadataType.MULTI_SELECT]: 'multiSelect',
  [FieldMetadataType.DATE]: 'date',
  [FieldMetadataType.DATE_TIME]: 'dateTime',
  [FieldMetadataType.LINKS]: 'link',
  [FieldMetadataType.EMAILS]: 'email',
  [FieldMetadataType.PHONES]: 'phone',
  [FieldMetadataType.CURRENCY]: 'currency',
  [FieldMetadataType.FULL_NAME]: 'fullName',
  [FieldMetadataType.RATING]: 'rating',
};

// Null means the field is shown but not edited in place (system, computed, rich or composite-heavy types)
export const getRoboostFieldEditKind = (
  field: FieldMetadataItem,
): RoboostFieldEditKind | null => {
  if (READ_ONLY_FIELD_NAMES.has(field.name) || field.isSystem === true) {
    return null;
  }

  if (field.type === FieldMetadataType.RELATION) {
    return field.relation?.type === RelationType.MANY_TO_ONE
      ? 'relation'
      : null;
  }

  return KIND_BY_TYPE[field.type] ?? null;
};
