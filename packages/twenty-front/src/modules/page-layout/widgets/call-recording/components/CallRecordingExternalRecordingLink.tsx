import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { IconExternalLink, IconVideo } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

import { type WidgetCallRecordingCandidate } from '@/page-layout/widgets/call-recording/types/WidgetCallRecordingCandidate';

const StyledLink = styled.a`
  align-items: center;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-decoration: none;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledHint = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  white-space: nowrap;
`;

type CallRecordingExternalRecordingLinkProps = {
  callRecording: Pick<WidgetCallRecordingCandidate, 'recordingUrl'>;
};

// Recordings that stay with the meeting provider open there instead of playing inline
export const CallRecordingExternalRecordingLink = ({
  callRecording,
}: CallRecordingExternalRecordingLinkProps) => {
  const theme = useTheme();
  const url = callRecording.recordingUrl?.primaryLinkUrl;

  if (!isNonEmptyString(url)) {
    return null;
  }

  return (
    <StyledLink href={url} target="_blank" rel="noopener noreferrer">
      <IconVideo size={theme.icon.size.md} />
      <StyledLabel>
        {callRecording.recordingUrl?.primaryLinkLabel || t`Recording`}
      </StyledLabel>
      <StyledHint>{t`Open in Google Drive`}</StyledHint>
      <IconExternalLink size={theme.icon.size.sm} />
    </StyledLink>
  );
};
