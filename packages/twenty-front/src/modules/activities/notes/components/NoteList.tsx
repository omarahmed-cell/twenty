import { styled } from '@linaria/react';

import { type NoteLikeActivity } from '@/activities/types/NoteLikeActivity';
import { type NoteLikeActivityObjectNameSingular } from '@/activities/types/NoteLikeActivityObjectNameSingular';
import { FieldDescriptionTooltipProvider } from '@/object-record/record-field/ui/components/FieldDescriptionTooltipProvider';
import { themeCssVariables } from 'twenty-ui/theme';

import { NoteTile } from './NoteTile';

type NoteListProps = {
  notes: NoteLikeActivity[];
  activityObjectNameSingular: NoteLikeActivityObjectNameSingular;
};

const StyledContainer = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const StyledNoteContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

export const NoteList = ({
  notes,
  activityObjectNameSingular,
}: NoteListProps) => {
  return (
    <>
      {notes.length > 0 && (
        <FieldDescriptionTooltipProvider>
          <StyledContainer>
            <StyledNoteContainer>
              {notes.map((note) => (
                <NoteTile
                  key={note.id}
                  note={note}
                  activityObjectNameSingular={activityObjectNameSingular}
                />
              ))}
            </StyledNoteContainer>
          </StyledContainer>
        </FieldDescriptionTooltipProvider>
      )}
    </>
  );
};
