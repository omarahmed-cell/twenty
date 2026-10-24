import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';

import { useActivityFieldComponentInstanceId } from '@/activities/hooks/useActivityFieldComponentInstanceId';
import { type NoteLikeActivity } from '@/activities/types/NoteLikeActivity';
import { type NoteLikeActivityObjectNameSingular } from '@/activities/types/NoteLikeActivityObjectNameSingular';
import { getActivityPreview } from '@/activities/utils/getActivityPreview';
import { dateLocaleState } from '@/localization/states/dateLocaleState';
import { FieldContextProvider } from '@/object-record/record-field/ui/components/FieldContextProvider';
import { useObjectMorphJunctionConfigOrThrow } from '@/object-record/record-field/ui/hooks/useObjectMorphJunctionConfigOrThrow';
import { RecordFieldComponentInstanceContext } from '@/object-record/record-field/ui/states/contexts/RecordFieldComponentInstanceContext';
import { RecordInlineCell } from '@/object-record/record-inline-cell/components/RecordInlineCell';
import { getRecordFieldInputInstanceId } from '@/object-record/utils/getRecordFieldInputId';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { ActorDisplay } from '@/ui/field/display/components/ActorDisplay';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';
import { beautifyPastDateRelativeToNow } from '~/utils/date-utils';

const StyledCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const StyledCardDetailsContainer = styled.div`
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledCardHeader = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledTimestamp = styled.span`
  white-space: nowrap;
`;

const StyledNoteTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledCardContent = styled.div`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: ${themeCssVariables.font.color.secondary};
  display: -webkit-box;
  line-break: anywhere;
  overflow: hidden;
  white-space: pre-line;
`;

const StyledFooter = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  width: 100%;
`;

export const NoteTile = ({
  note,
  activityObjectNameSingular,
}: {
  note: NoteLikeActivity;
  activityObjectNameSingular: NoteLikeActivityObjectNameSingular;
}) => {
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const { localeCatalog } = useAtomStateValue(dateLocaleState);

  const body = getActivityPreview(note?.bodyV2?.blocknote ?? null);

  const junctionFieldName = useObjectMorphJunctionConfigOrThrow({
    objectNameSingular: activityObjectNameSingular,
  }).junctionField.name;

  const instanceIdPrefix =
    useActivityFieldComponentInstanceId('note-card-targets');
  const componentInstanceId = getRecordFieldInputInstanceId({
    recordId: note.id,
    fieldName: junctionFieldName,
    prefix: instanceIdPrefix,
  });

  return (
    <StyledCard>
      <StyledCardDetailsContainer
        onClick={() =>
          openRecordInSidePanel({
            recordId: note.id,
            objectNameSingular: activityObjectNameSingular,
          })
        }
      >
        <StyledCardHeader>
          {isDefined(note.createdBy) && (
            <ActorDisplay
              name={note.createdBy.name}
              source={note.createdBy.source}
              workspaceMemberId={note.createdBy.workspaceMemberId}
              context={note.createdBy.context}
            />
          )}
          {isNonEmptyString(note.createdAt) && (
            <StyledTimestamp>
              {beautifyPastDateRelativeToNow(note.createdAt, localeCatalog)}
            </StyledTimestamp>
          )}
        </StyledCardHeader>
        <StyledNoteTitle>{note.title || t`Untitled`}</StyledNoteTitle>
        {isNonEmptyString(body) && (
          <StyledCardContent>{body}</StyledCardContent>
        )}
      </StyledCardDetailsContainer>
      <StyledFooter>
        <FieldContextProvider
          objectNameSingular={activityObjectNameSingular}
          objectRecordId={note.id}
          fieldMetadataName={junctionFieldName}
          fieldPosition={0}
          isDisplayModeFixHeight
        >
          <RecordFieldComponentInstanceContext.Provider
            value={{ instanceId: componentInstanceId }}
          >
            <RecordInlineCell instanceIdPrefix={instanceIdPrefix} />
          </RecordFieldComponentInstanceContext.Provider>
        </FieldContextProvider>
      </StyledFooter>
    </StyledCard>
  );
};
