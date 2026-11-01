import { type CoreObjectShowPageProps } from '@/object-core/types/CoreObjectShowPageProps';
import { RecordShowContainerContextStoreTargetedRecordsEffect } from '@/object-record/record-show/components/RecordShowContainerContextStoreTargetedRecordsEffect';
import { useRecordShowPageResource } from '@/object-record/record-show/hooks/useRecordShowPageResource';
import { SegmentMembersContainer } from '@/segment/components/SegmentMembersContainer';
import { useWorkspaceSurface } from '@/ui/layout/hooks/useWorkspaceSurface';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { RecordShowPageContent } from '~/pages/object-record/RecordShowPageContent';
import { RecordShowPageShell } from '~/pages/object-record/RecordShowPageShell';

type SegmentCoreObjectShowPageProps = CoreObjectShowPageProps;

type SegmentMembersShowPageProps = CoreObjectShowPageProps;

const SegmentMembersShowPage = ({
  objectRecordId,
}: SegmentMembersShowPageProps) => {
  const { error, loading, record } = useRecordShowPageResource({
    objectNameSingular: CoreObjectNameSingular.Segment,
    recordId: objectRecordId,
  });

  return (
    <RecordShowPageShell
      objectNameSingular={CoreObjectNameSingular.Segment}
      objectRecordId={objectRecordId}
      record={record}
      loading={loading}
      error={error}
      body={
        <>
          <RecordShowContainerContextStoreTargetedRecordsEffect
            recordId={objectRecordId}
          />
          <SegmentMembersContainer segmentId={objectRecordId} />
        </>
      }
    />
  );
};

// The full page lists the segment's members; the side panel keeps the segment's own details.
export const SegmentCoreObjectShowPage = ({
  objectRecordId,
}: SegmentCoreObjectShowPageProps) => {
  const isInSidePanel = useWorkspaceSurface().type === 'side-panel';

  if (isInSidePanel) {
    return (
      <RecordShowPageContent
        parameters={{
          objectNameSingular: CoreObjectNameSingular.Segment,
          objectRecordId,
        }}
      />
    );
  }

  return <SegmentMembersShowPage objectRecordId={objectRecordId} />;
};
