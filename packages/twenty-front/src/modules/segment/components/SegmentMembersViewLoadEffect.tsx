import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useLoadRecordIndexStates } from '@/object-record/record-index/hooks/useLoadRecordIndexStates';
import { lastLoadedRecordTableWidgetViewIdComponentState } from '@/object-record/record-table-widget/states/lastLoadedRecordTableWidgetViewIdComponentState';
import { computeRecordTableWidgetViewLoadContentSignature } from '@/object-record/record-table-widget/utils/computeRecordTableWidgetViewLoadContentSignature';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { viewFromViewIdFamilySelector } from '@/views/states/selectors/viewFromViewIdFamilySelector';
import { useEffect } from 'react';
import { isDefined } from 'twenty-shared/utils';

type SegmentMembersViewLoadEffectProps = {
  viewId: string;
  objectMetadataItem: EnrichedObjectMetadataItem;
};

export const SegmentMembersViewLoadEffect = ({
  viewId,
  objectMetadataItem,
}: SegmentMembersViewLoadEffectProps) => {
  const { loadRecordIndexStates } = useLoadRecordIndexStates();
  const { recordIndexId } = useRecordIndexContextOrThrow();

  const [
    lastLoadedRecordTableWidgetViewId,
    setLastLoadedRecordTableWidgetViewId,
  ] = useAtomComponentState(lastLoadedRecordTableWidgetViewIdComponentState);

  const view = useAtomFamilySelectorValue(viewFromViewIdFamilySelector, {
    viewId,
  });

  useEffect(() => {
    if (!isDefined(view) || view.viewFields.length === 0) {
      return;
    }

    const contentSignature =
      computeRecordTableWidgetViewLoadContentSignature(view);

    if (
      lastLoadedRecordTableWidgetViewId?.viewId === viewId &&
      lastLoadedRecordTableWidgetViewId.objectMetadataItemUpdatedAt ===
        objectMetadataItem.updatedAt &&
      lastLoadedRecordTableWidgetViewId.loadedViewContentSignature ===
        contentSignature
    ) {
      return;
    }

    loadRecordIndexStates(view, objectMetadataItem, { recordIndexId });

    setLastLoadedRecordTableWidgetViewId({
      viewId,
      objectMetadataItemUpdatedAt: objectMetadataItem.updatedAt,
      loadedViewContentSignature: contentSignature,
    });
  }, [
    view,
    viewId,
    lastLoadedRecordTableWidgetViewId,
    setLastLoadedRecordTableWidgetViewId,
    objectMetadataItem,
    loadRecordIndexStates,
    recordIndexId,
  ]);

  return null;
};
