import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { formatFieldMetadataItemAsFieldDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsFieldDefinition';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useIsRecordReadOnly } from '@/object-record/read-only/hooks/useIsRecordReadOnly';
import { isRecordFieldReadOnly } from '@/object-record/read-only/utils/isRecordFieldReadOnly';
import { useDealAdminOnlyFieldNames } from '@/pipeline/rules/hooks/useDealAdminOnlyFieldNames';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';

export type UseFieldIsReadOnlyParams = {
  fieldMetadataId: string;
  objectMetadataId: string;
  recordId: string;
};

export const useIsRecordFieldReadOnly = ({
  fieldMetadataId,
  objectMetadataId,
  recordId,
}: UseFieldIsReadOnlyParams) => {
  const { objectMetadataItem } = useObjectMetadataItemById({
    objectId: objectMetadataId,
  });

  const fieldMetadataItem = objectMetadataItem.fields.find(
    (field) => field.id === fieldMetadataId,
  );

  const fieldDefinition = useMemo(
    () =>
      isDefined(fieldMetadataItem)
        ? formatFieldMetadataItemAsFieldDefinition({
            field: fieldMetadataItem,
            objectMetadataItem,
          })
        : undefined,
    [fieldMetadataItem, objectMetadataItem],
  );

  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();

  const isRecordReadOnly = useIsRecordReadOnly({
    recordId,
    objectMetadataId,
  });

  const dealAdminOnlyFieldNames = useDealAdminOnlyFieldNames(
    objectMetadataItem.nameSingular,
  );

  if (!isDefined(fieldMetadataItem)) {
    return false;
  }

  if (dealAdminOnlyFieldNames.includes(fieldMetadataItem.name)) {
    return true;
  }

  return isRecordFieldReadOnly({
    isRecordReadOnly,
    objectMetadataId,
    fieldMetadataItem,
    fieldDefinition,
    objectPermissionsByObjectMetadataId,
  });
};
