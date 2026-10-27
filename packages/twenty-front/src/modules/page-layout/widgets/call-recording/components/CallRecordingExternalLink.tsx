import { styled } from '@linaria/react';
import { isNonEmptyString } from '@sniptt/guards';
import { type IconComponent, IconExternalLink } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

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

type CallRecordingExternalLinkProps = {
  url: string | null | undefined;
  label: string;
  hint?: string;
  Icon: IconComponent;
};

// Files that stay with the meeting provider open there instead of rendering inline
export const CallRecordingExternalLink = ({
  url,
  label,
  hint,
  Icon,
}: CallRecordingExternalLinkProps) => {
  const theme = useTheme();

  if (!isNonEmptyString(url)) {
    return null;
  }

  return (
    <StyledLink href={url} target="_blank" rel="noopener noreferrer">
      <Icon size={theme.icon.size.md} />
      <StyledLabel>{label}</StyledLabel>
      {isNonEmptyString(hint) && <StyledHint>{hint}</StyledHint>}
      <IconExternalLink size={theme.icon.size.sm} />
    </StyledLink>
  );
};
