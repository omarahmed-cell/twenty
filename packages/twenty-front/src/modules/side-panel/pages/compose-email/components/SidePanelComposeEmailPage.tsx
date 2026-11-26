import { EmailComposerFields } from '@/activities/emails/components/EmailComposerFields';
import { useEmailComposerState } from '@/activities/emails/hooks/useEmailComposerState';
import { useSidePanelHistory } from '@/side-panel/hooks/useSidePanelHistory';
import { composeEmailConnectedAccountIdComponentState } from '@/side-panel/pages/compose-email/states/composeEmailConnectedAccountIdComponentState';
import { composeEmailContextRecordComponentState } from '@/side-panel/pages/compose-email/states/composeEmailContextRecordComponentState';
import { composeEmailDefaultInReplyToComponentState } from '@/side-panel/pages/compose-email/states/composeEmailDefaultInReplyToComponentState';
import { composeEmailDefaultSubjectComponentState } from '@/side-panel/pages/compose-email/states/composeEmailDefaultSubjectComponentState';
import { composeEmailDefaultToComponentState } from '@/side-panel/pages/compose-email/states/composeEmailDefaultToComponentState';
import { SidePanelFooter } from '@/ui/layout/side-panel/components/SidePanelFooter';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { IconPaperclip, IconSend, IconTrash } from 'twenty-ui/icon';
import { Button, Checkbox } from 'twenty-ui/primitives/input';
import { IconButton } from 'twenty-ui/components/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { useAttachEmailFiles } from '@/activities/emails/hooks/useAttachEmailFiles';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const StyledTrackOption = styled.label`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
`;

export const SidePanelComposeEmailPage = () => {
  const composeEmailConnectedAccountId = useAtomComponentStateValue(
    composeEmailConnectedAccountIdComponentState,
  );
  const composeEmailDefaultTo = useAtomComponentStateValue(
    composeEmailDefaultToComponentState,
  );
  const composeEmailDefaultSubject = useAtomComponentStateValue(
    composeEmailDefaultSubjectComponentState,
  );
  const composeEmailDefaultInReplyTo = useAtomComponentStateValue(
    composeEmailDefaultInReplyToComponentState,
  );
  const composeEmailContextRecord = useAtomComponentStateValue(
    composeEmailContextRecordComponentState,
  );

  const { goBackFromSidePanel } = useSidePanelHistory();

  const composerState = useEmailComposerState({
    connectedAccountId: composeEmailConnectedAccountId ?? '',
    defaultTo: composeEmailDefaultTo ?? '',
    defaultSubject: composeEmailDefaultSubject ?? '',
    defaultInReplyTo: composeEmailDefaultInReplyTo ?? undefined,
    contextRecord: composeEmailContextRecord,
    onSent: goBackFromSidePanel,
  });

  const { openAttachmentPicker, isUploadingAttachments } = useAttachEmailFiles({
    onFilesAttached: composerState.setFiles,
  });

  const canSend = composerState.canSend && !isUploadingAttachments;

  if (!composeEmailConnectedAccountId) {
    return null;
  }

  return (
    <StyledContainer>
      <StyledContent>
        <EmailComposerFields
          composerState={composerState}
          contextRecord={composeEmailContextRecord}
          onOpenAttachmentPicker={openAttachmentPicker}
        />
      </StyledContent>
      <SidePanelFooter
        actions={[
          <IconButton
            key="discard"
            size="sm"
            variant="outline"
            aria-label={t`Discard`}
            onClick={goBackFromSidePanel}
          >
            <IconTrash />
          </IconButton>,
          <IconButton
            key="attach"
            size="sm"
            variant="outline"
            aria-label={t`Attach files`}
            onClick={openAttachmentPicker}
          >
            <IconPaperclip />
          </IconButton>,
          <StyledTrackOption key="track">
            <Checkbox
              aria-label={t`Track opens and clicks`}
              checked={composerState.trackEmail}
              onCheckedChange={(checked) =>
                composerState.setTrackEmail(checked === true)
              }
            />
            {t`Track`}
          </StyledTrackOption>,
          <Button
            key="send"
            size="sm"
            startIcon={<IconSend />}
            onClick={composerState.handleSend}
            disabled={!canSend}
            variant="solid"
            color="accent"
          >{t`Send`}</Button>,
        ]}
      />
    </StyledContainer>
  );
};
