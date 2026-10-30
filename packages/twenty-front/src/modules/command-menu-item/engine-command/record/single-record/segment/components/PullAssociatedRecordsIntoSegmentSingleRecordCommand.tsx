import { HeadlessEngineCommandWrapperEffect } from '@/command-menu-item/engine-command/components/HeadlessEngineCommandWrapperEffect';
import { useHeadlessCommandContextApi } from '@/command-menu-item/engine-command/hooks/useHeadlessCommandContextApi';
import { useOpenSegmentPullInSidePanel } from '@/side-panel/hooks/useOpenSegmentPullInSidePanel';
import { doNotTranslate } from 'twenty-shared/i18n';
import { isDefined } from 'twenty-shared/utils';

export const PullAssociatedRecordsIntoSegmentSingleRecordCommand = () => {
  const { selectedRecords } = useHeadlessCommandContextApi();
  const segmentId = selectedRecords[0]?.id;

  const { openSegmentPullInSidePanel } = useOpenSegmentPullInSidePanel();

  if (!isDefined(segmentId)) {
    throw new Error(
      doNotTranslate('Segment ID is required to pull associated records'),
    );
  }

  return (
    <HeadlessEngineCommandWrapperEffect
      execute={() => openSegmentPullInSidePanel(segmentId)}
    />
  );
};
