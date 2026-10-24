import { CustomResolverFetchMoreLoader } from '@/activities/components/CustomResolverFetchMoreLoader';
import { SkeletonLoader } from '@/activities/components/SkeletonLoader';
import { NoteList } from '@/activities/notes/components/NoteList';
import { type NoteLikeActivity } from '@/activities/types/NoteLikeActivity';
import { type NoteLikeActivityObjectNameSingular } from '@/activities/types/NoteLikeActivityObjectNameSingular';
import { AnimatedPlaceholder } from '@/ui/feedback/empty-state/components/AnimatedPlaceholder/AnimatedPlaceholder';
import { EmptyState } from '@/ui/feedback/empty-state/components/EmptyState';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { IconPlus } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

const StyledNotesContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  overflow: auto;
`;

type NotesCardContentProps = {
  loading: boolean;
  notes: NoteLikeActivity[];
  activityObjectNameSingular: NoteLikeActivityObjectNameSingular;
  onCreateNote: (() => void) | undefined;
  onLastRowVisible: () => Promise<void>;
};

const getEmptyStateCopy = (
  activityObjectNameSingular: NoteLikeActivityObjectNameSingular,
) => {
  switch (activityObjectNameSingular) {
    case CoreObjectNameSingular.Call:
      return {
        title: t`No calls`,
        description: t`There are no calls logged on this record.`,
        createLabel: t`Log call`,
      };
    case CoreObjectNameSingular.Communication:
      return {
        title: t`No communications`,
        description: t`There are no communications logged on this record.`,
        createLabel: t`Log communication`,
      };
    case CoreObjectNameSingular.Note:
      return {
        title: t`No notes`,
        description: t`There are no associated notes with this record.`,
        createLabel: t`New note`,
      };
  }
};

export const NotesCardContent = ({
  loading,
  notes,
  activityObjectNameSingular,
  onCreateNote,
  onLastRowVisible,
}: NotesCardContentProps) => {
  const isNotesEmpty = notes.length === 0;

  if (loading && isNotesEmpty) {
    return <SkeletonLoader />;
  }

  if (isNotesEmpty) {
    const emptyStateCopy = getEmptyStateCopy(activityObjectNameSingular);

    return (
      <EmptyState.Root>
        <AnimatedPlaceholder type="noNote" />
        <EmptyState.Content>
          <EmptyState.Title>{emptyStateCopy.title}</EmptyState.Title>
          <EmptyState.Description>
            {emptyStateCopy.description}
          </EmptyState.Description>
        </EmptyState.Content>
        {isDefined(onCreateNote) && (
          <Button
            startIcon={<IconPlus />}
            onClick={onCreateNote}
            variant="outline"
          >
            {emptyStateCopy.createLabel}
          </Button>
        )}
      </EmptyState.Root>
    );
  }

  return (
    <StyledNotesContainer>
      <NoteList
        notes={notes}
        activityObjectNameSingular={activityObjectNameSingular}
      />
      <CustomResolverFetchMoreLoader
        loading={loading}
        onLastRowVisible={onLastRowVisible}
      />
    </StyledNotesContainer>
  );
};
