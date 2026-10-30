import { t } from '@lingui/core/macro';

export const getSegmentPullResultMessage = ({
  addedRecordCount,
  removedRecordCount,
  memberCount,
}: {
  addedRecordCount: number;
  removedRecordCount: number;
  memberCount: number;
}) =>
  t`Segment updated: ${addedRecordCount} added, ${removedRecordCount} removed, ${memberCount} in total`;
