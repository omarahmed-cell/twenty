import { HeadlessEngineCommandWrapperEffect } from '@/command-menu-item/engine-command/components/HeadlessEngineCommandWrapperEffect';
import { useHeadlessCommandContextApi } from '@/command-menu-item/engine-command/hooks/useHeadlessCommandContextApi';
import { useOpenSegmentMembershipInSidePanel } from '@/side-panel/hooks/useOpenSegmentMembershipInSidePanel';
import { type SegmentMembershipOperation } from '@/side-panel/pages/segment-membership/types/SegmentMembershipOperation';
import { doNotTranslate } from 'twenty-shared/i18n';
import { isDefined } from 'twenty-shared/utils';

type SegmentMembershipRecordsCommandProps = {
  operation: SegmentMembershipOperation;
};

export const SegmentMembershipRecordsCommand = ({
  operation,
}: SegmentMembershipRecordsCommandProps) => {
  const { graphqlFilter, objectMetadataItem } = useHeadlessCommandContextApi();

  const { openSegmentMembershipInSidePanel } =
    useOpenSegmentMembershipInSidePanel();

  if (!isDefined(graphqlFilter) || !isDefined(objectMetadataItem)) {
    throw new Error(
      doNotTranslate('Selected records filter is required to update a segment'),
    );
  }

  return (
    <HeadlessEngineCommandWrapperEffect
      execute={() =>
        openSegmentMembershipInSidePanel({
          operation,
          objectNameSingular: objectMetadataItem.nameSingular,
          recordFilter: graphqlFilter,
        })
      }
    />
  );
};
