import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

export type RoboostFilterFieldKind =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'multiSelect'
  | 'boolean'
  | 'relation';

const KIND_BY_TYPE: Partial<Record<FieldMetadataType, RoboostFilterFieldKind>> =
  {
    [FieldMetadataType.TEXT]: 'text',
    [FieldMetadataType.FULL_NAME]: 'text',
    [FieldMetadataType.LINKS]: 'text',
    [FieldMetadataType.EMAILS]: 'text',
    [FieldMetadataType.PHONES]: 'text',
    [FieldMetadataType.UUID]: 'text',
    [FieldMetadataType.NUMBER]: 'number',
    [FieldMetadataType.NUMERIC]: 'number',
    [FieldMetadataType.CURRENCY]: 'currency',
    [FieldMetadataType.DATE]: 'date',
    [FieldMetadataType.DATE_TIME]: 'date',
    [FieldMetadataType.SELECT]: 'select',
    [FieldMetadataType.RATING]: 'select',
    [FieldMetadataType.MULTI_SELECT]: 'multiSelect',
    [FieldMetadataType.BOOLEAN]: 'boolean',
  };

export const getRoboostFilterFieldKind = (
  field: Pick<FieldMetadataItem, 'type' | 'relation'>,
): RoboostFilterFieldKind | null => {
  if (field.type === FieldMetadataType.RELATION) {
    return field.relation?.type === RelationType.MANY_TO_ONE
      ? 'relation'
      : null;
  }

  return KIND_BY_TYPE[field.type] ?? null;
};
