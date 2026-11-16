import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { useIsObjectReadOnly } from '@/object-record/read-only/hooks/useIsObjectReadOnly';
import { useIsRecordDeleted } from '@/object-record/record-field/ui/hooks/useIsRecordDeleted';
import { useDealRecordLock } from '@/pipeline/rules/hooks/useDealRecordLock';

type UseIsRecordReadOnlyParams = {
  recordId: string;
  objectMetadataId: string;
};

export const useIsRecordReadOnly = ({
  recordId,
  objectMetadataId,
}: UseIsRecordReadOnlyParams) => {
  const isObjectReadOnly = useIsObjectReadOnly(objectMetadataId);
  const isRecordDeleted = useIsRecordDeleted({ recordId });
  const { objectMetadataItem } = useObjectMetadataItemById({
    objectId: objectMetadataId,
  });
  const { isLocked: isDealLocked } = useDealRecordLock({
    objectNameSingular: objectMetadataItem.nameSingular,
    recordId,
  });

  return isObjectReadOnly || isRecordDeleted || isDealLocked;
};
