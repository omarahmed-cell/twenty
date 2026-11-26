import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostLabelIdentifierFieldName } from '@/roboost-app/fields/getRoboostRecordLabel';
import { type RecordGqlFields } from 'twenty-shared/types';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

export const getRoboostRelationGqlFields = (
  field: FieldMetadataItem,
  objectMetadataItems: EnrichedObjectMetadataItem[],
): RecordGqlFields => {
  const target = objectMetadataItems.find(
    (item) =>
      item.nameSingular === field.relation?.targetObjectMetadata.nameSingular,
  );
  const targetFields: RecordGqlFields = { id: true };

  targetFields[getRoboostLabelIdentifierFieldName(target)] = true;
  if (target?.fields.some((candidate) => candidate.name === 'avatarUrl')) {
    targetFields.avatarUrl = true;
  }

  return targetFields;
};

export const getRoboostListRecordGqlFields = (
  objectMetadataItem: EnrichedObjectMetadataItem,
  fields: FieldMetadataItem[],
  objectMetadataItems: EnrichedObjectMetadataItem[],
): RecordGqlFields => {
  const recordGqlFields: RecordGqlFields = { id: true };

  recordGqlFields[getRoboostLabelIdentifierFieldName(objectMetadataItem)] =
    true;

  for (const field of fields) {
    if (field.type !== FieldMetadataType.RELATION) {
      recordGqlFields[field.name] = true;
      // A deal Amount is shown in the deal's currency
      if (field.name === 'dealAmount') {
        recordGqlFields.currency = true;
      }
      continue;
    }
    recordGqlFields[field.name] =
      field.relation?.type === RelationType.MANY_TO_ONE
        ? getRoboostRelationGqlFields(field, objectMetadataItems)
        : { id: true };
  }

  return recordGqlFields;
};
