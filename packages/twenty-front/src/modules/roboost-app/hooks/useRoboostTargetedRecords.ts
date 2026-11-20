import { getActivityTargetsFilter } from '@/activities/utils/getActivityTargetsFilter';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import {
  CoreObjectNameSingular,
  type RecordGqlFields,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const TARGETED_RECORDS_LIMIT = 200;

// Reads the activities linked to a record through a junction object (noteTarget, taskTarget, ...)
export const useRoboostTargetedRecords = ({
  junctionObjectNameSingular,
  relationFieldName,
  recordGqlFields,
  targetRecordId,
  targetObjectNameSingular,
}: {
  junctionObjectNameSingular: string;
  relationFieldName: string;
  recordGqlFields: RecordGqlFields;
  targetRecordId: string;
  targetObjectNameSingular: string;
}) => {
  const objectMetadataItems = useAtomStateValue<EnrichedObjectMetadataItem[]>(
    objectMetadataItemsSelector,
  );

  const junctionObjectMetadata = objectMetadataItems.find(
    (objectMetadataItem) =>
      objectMetadataItem.nameSingular === junctionObjectNameSingular &&
      objectMetadataItem.isActive,
  );

  const filter = isDefined(junctionObjectMetadata)
    ? getActivityTargetsFilter({
        targetableObjects: [{ id: targetRecordId, targetObjectNameSingular }],
        activityTargetObjectMetadata: junctionObjectMetadata,
        objectMetadataItems,
      })
    : undefined;

  const isAvailable = isDefined(filter) && filter.or.length > 0;

  // A missing junction object still needs a valid object name for the hook; the read is skipped
  const { records, loading } = useFindManyRecords<
    ObjectRecord & Record<string, unknown>
  >({
    objectNameSingular: isAvailable
      ? junctionObjectNameSingular
      : CoreObjectNameSingular.NoteTarget,
    filter,
    skip: !isAvailable,
    recordGqlFields: {
      id: true,
      [relationFieldName]: recordGqlFields,
    },
    limit: TARGETED_RECORDS_LIMIT,
  });

  const relatedRecords = new Map<string, Record<string, unknown>>();

  for (const junctionRecord of isAvailable ? records : []) {
    const relatedRecord = junctionRecord[relationFieldName] as
      | (Record<string, unknown> & { id: string })
      | null
      | undefined;

    if (isDefined(relatedRecord)) {
      relatedRecords.set(relatedRecord.id, relatedRecord);
    }
  }

  return { records: [...relatedRecords.values()], loading };
};
