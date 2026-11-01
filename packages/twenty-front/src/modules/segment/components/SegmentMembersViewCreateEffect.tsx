import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { buildRecordTableWidgetViewSnapshot } from '@/page-layout/widgets/record-table/utils/buildRecordTableWidgetViewSnapshot';
import { SEGMENT_MEMBERSHIP_FIELD_NAME } from '@/segment/constants/SegmentMembershipFieldName';
import { segmentMembersViewCreationInFlightObjectMetadataIdsState } from '@/segment/states/segmentMembersViewCreationInFlightObjectMetadataIdsState';
import { usePerformViewApiPersist } from '@/views/hooks/internal/usePerformViewApiPersist';
import { usePerformViewFieldApiPersist } from '@/views/hooks/internal/usePerformViewFieldApiPersist';
import { t } from '@lingui/core/macro';
import { useStore } from 'jotai';
import { useEffect } from 'react';

type SegmentMembersViewCreateEffectProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  viewId: string;
};

export const SegmentMembersViewCreateEffect = ({
  objectMetadataItem,
  viewId,
}: SegmentMembersViewCreateEffectProps) => {
  const store = useStore();
  const { performViewApiCreate } = usePerformViewApiPersist();
  const { performViewFieldApiCreate } = usePerformViewFieldApiPersist();

  useEffect(() => {
    const inFlightState =
      segmentMembersViewCreationInFlightObjectMetadataIdsState.atom;

    if (store.get(inFlightState).includes(objectMetadataItem.id)) {
      return;
    }

    store.set(inFlightState, (previous) => [
      ...previous,
      objectMetadataItem.id,
    ]);

    const createView = async () => {
      const { view, viewFields } =
        buildRecordTableWidgetViewSnapshot(objectMetadataItem);

      const viewResult = await performViewApiCreate(
        {
          input: {
            id: viewId,
            name: t`Segment members`,
            icon: view.icon,
            objectMetadataId: objectMetadataItem.id,
            type: view.type,
            isCompact: view.isCompact,
            position: view.position,
            visibility: view.visibility,
            shouldHideEmptyGroups: view.shouldHideEmptyGroups,
          },
        },
        objectMetadataItem.id,
      );

      if (viewResult.status === 'failed') {
        return;
      }

      const segmentMembershipFieldMetadataId = objectMetadataItem.fields.find(
        (field) => field.name === SEGMENT_MEMBERSHIP_FIELD_NAME,
      )?.id;

      await performViewFieldApiCreate({
        inputs: viewFields.map((viewField) => ({
          viewId,
          fieldMetadataId: viewField.fieldMetadataId,
          position: viewField.position,
          size: viewField.size,
          isVisible:
            viewField.isVisible &&
            viewField.fieldMetadataId !== segmentMembershipFieldMetadataId,
        })),
      });
    };

    void createView().finally(() =>
      store.set(inFlightState, (previous) =>
        previous.filter((id) => id !== objectMetadataItem.id),
      ),
    );
  }, [
    objectMetadataItem,
    viewId,
    performViewApiCreate,
    performViewFieldApiCreate,
    store,
  ]);

  return null;
};
