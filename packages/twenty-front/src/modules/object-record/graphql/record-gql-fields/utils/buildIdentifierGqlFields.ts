import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getImageIdentifierFieldMetadataItem } from '@/object-metadata/utils/getImageIdentifierFieldMetadataItem';
import { getLabelIdentifierFieldMetadataItem } from '@/object-metadata/utils/getLabelIdentifierFieldMetadataItem';
import {
  CoreObjectNameSingular,
  type RecordGqlFields,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const buildIdentifierGqlFields = (
  objectMetadata: Pick<
    EnrichedObjectMetadataItem,
    | 'fields'
    | 'labelIdentifierFieldMetadataId'
    | 'imageIdentifierFieldMetadataId'
    | 'nameSingular'
  >,
): RecordGqlFields => {
  const labelIdentifierField =
    getLabelIdentifierFieldMetadataItem(objectMetadata);
  const imageIdentifierField =
    getImageIdentifierFieldMetadataItem(objectMetadata);

  // Chips label deactivated workspace members, so their status rides along with the identifier
  const hasMemberStatusField =
    objectMetadata.nameSingular === CoreObjectNameSingular.WorkspaceMember &&
    objectMetadata.fields.some((field) => field.name === 'memberStatus');

  return {
    id: true,
    ...(isDefined(labelIdentifierField) && {
      [labelIdentifierField.name]: true,
    }),
    ...(isDefined(imageIdentifierField) && {
      [imageIdentifierField.name]: true,
    }),
    ...(hasMemberStatusField && { memberStatus: true }),
  };
};
