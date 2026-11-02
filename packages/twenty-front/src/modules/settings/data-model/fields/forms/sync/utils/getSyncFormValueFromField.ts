import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type SettingsDataModelFieldSyncFormValue } from '@/settings/data-model/fields/forms/sync/components/SettingsDataModelFieldSyncForm';
import { type FieldMetadataSyncSettings } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const getFieldSyncSettings = (
  field: Pick<FieldMetadataItem, 'settings'> | undefined,
) =>
  (field?.settings as { sync?: FieldMetadataSyncSettings } | null | undefined)
    ?.sync;

export const getSyncFormValueFromField = (
  field: FieldMetadataItem,
  objectMetadataItem: EnrichedObjectMetadataItem,
  objectMetadataItems: EnrichedObjectMetadataItem[],
): SettingsDataModelFieldSyncFormValue => {
  const sync = getFieldSyncSettings(field);

  const relationField = objectMetadataItem.fields.find(
    ({ id, isActive }) =>
      id === sync?.relationFieldMetadataId && isActive === true,
  );

  const sourceField = objectMetadataItems
    .find(({ id }) => id === relationField?.relation?.targetObjectMetadata.id)
    ?.fields.find(
      ({ id, isActive }) =>
        id === sync?.sourceFieldMetadataId && isActive === true,
    );

  return {
    relationFieldMetadataId: isDefined(relationField)
      ? relationField.id
      : undefined,
    sourceField,
    policy: sync?.policy,
  };
};
