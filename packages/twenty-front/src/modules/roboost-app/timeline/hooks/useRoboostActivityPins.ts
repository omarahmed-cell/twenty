import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const ACTIVITY_PIN_OBJECT_NAME = 'activityPin';

type ActivityPinRecord = {
  id: string;
  activityObjectNameSingular: string;
  activityRecordId: string;
  __typename: string;
};

// Pins are per record: pinning a note on a company does not pin it on the contact it is also linked to
export const useRoboostActivityPins = ({
  targetObjectNameSingular,
  targetRecordId,
}: {
  targetObjectNameSingular: string;
  targetRecordId: string;
}) => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const isAvailable = objectMetadataItems.some(
    (item) => item.nameSingular === ACTIVITY_PIN_OBJECT_NAME,
  );
  // Record hooks throw for an unknown object even when skipped, so point them at Note until the upgrade has run
  const objectNameSingular = isAvailable
    ? ACTIVITY_PIN_OBJECT_NAME
    : CoreObjectNameSingular.Note;

  const { records, refetch } = useFindManyRecords<ActivityPinRecord>({
    objectNameSingular,
    filter: {
      targetObjectNameSingular: { eq: targetObjectNameSingular },
      targetRecordId: { eq: targetRecordId },
    },
    recordGqlFields: {
      id: true,
      activityObjectNameSingular: true,
      activityRecordId: true,
    },
    skip: !isAvailable,
  });
  const { createOneRecord } = useCreateOneRecord({ objectNameSingular });
  const { deleteOneRecord } = useDeleteOneRecord({ objectNameSingular });

  const findPin = (
    activityObjectNameSingular: string,
    activityRecordId: string,
  ) =>
    records.find(
      (pin) =>
        pin.activityObjectNameSingular === activityObjectNameSingular &&
        pin.activityRecordId === activityRecordId,
    );

  const togglePin = async (
    activityObjectNameSingular: string,
    activityRecordId: string,
  ) => {
    if (!isAvailable) {
      return;
    }
    const existing = findPin(activityObjectNameSingular, activityRecordId);

    if (isDefined(existing)) {
      await deleteOneRecord(existing.id);
    } else {
      await createOneRecord({
        targetObjectNameSingular,
        targetRecordId,
        activityObjectNameSingular,
        activityRecordId,
      });
    }
    await refetch();
  };

  return {
    isPinned: (activityObjectNameSingular: string, activityRecordId: string) =>
      isDefined(findPin(activityObjectNameSingular, activityRecordId)),
    togglePin,
  };
};
