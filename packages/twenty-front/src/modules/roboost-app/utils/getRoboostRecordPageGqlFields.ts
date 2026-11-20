import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type RecordGqlFields } from 'twenty-shared/types';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

const SKIPPED_TYPES = new Set<string>([
  FieldMetadataType.TS_VECTOR,
  FieldMetadataType.MORPH_RELATION,
]);

// Every scalar field plus the label of each many-to-one relation; lists are read separately
export const getRoboostRecordPageGqlFields = (
  objectMetadataItem: EnrichedObjectMetadataItem,
): RecordGqlFields => {
  const recordGqlFields: RecordGqlFields = { id: true };

  for (const field of objectMetadataItem.fields) {
    if (!field.isActive || SKIPPED_TYPES.has(field.type)) {
      continue;
    }

    if (field.type === FieldMetadataType.RELATION) {
      if (field.relation?.type === RelationType.MANY_TO_ONE) {
        recordGqlFields[field.name] = { id: true, name: true };
      }
      continue;
    }

    recordGqlFields[field.name] = true;
  }

  return recordGqlFields;
};
