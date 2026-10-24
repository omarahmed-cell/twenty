import { type NoteLikeActivityObjectNameSingular } from '@/activities/types/NoteLikeActivityObjectNameSingular';
import { useCreateActivityForTargetRecord } from '@/activities/hooks/useCreateActivityForTargetRecord';
import { NotesCardContent } from '@/activities/notes/components/NotesCardContent';
import { useNotes } from '@/activities/notes/hooks/useNotes';
import { WidgetHeaderCountEffect } from '@/page-layout/widgets/components/WidgetHeaderCountEffect';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { CoreObjectNameSingular } from 'twenty-shared/types';

type NotesCardProps = {
  activityObjectNameSingular?: NoteLikeActivityObjectNameSingular;
};

export const NotesCard = ({
  activityObjectNameSingular = CoreObjectNameSingular.Note,
}: NotesCardProps) => {
  const targetRecord = useTargetRecord();
  const { notes, loading, totalCountNotes, fetchMoreNotes, hasNextPage } =
    useNotes(targetRecord, activityObjectNameSingular);

  const handleLastRowVisible = async () => {
    if (hasNextPage) {
      await fetchMoreNotes();
    }
  };

  const { canCreateActivity, createActivity } =
    useCreateActivityForTargetRecord({
      targetRecord,
      activityObjectNameSingular,
    });

  return (
    <>
      <WidgetHeaderCountEffect count={totalCountNotes} />
      <NotesCardContent
        loading={loading}
        notes={notes}
        activityObjectNameSingular={activityObjectNameSingular}
        onCreateNote={canCreateActivity ? createActivity : undefined}
        onLastRowVisible={handleLastRowVisible}
      />
    </>
  );
};
