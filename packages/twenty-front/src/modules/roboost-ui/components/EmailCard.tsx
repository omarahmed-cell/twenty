import { Avatar } from '@/roboost-ui/components/Avatar';
import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostAvatarTone } from '@/roboost-ui/types/RoboostAvatarTone';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useState } from 'react';

const StyledCard = styled.div`
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.border};
  border-radius: ${ROBOOST_UI_THEME.radiusMd};
  overflow: hidden;
`;

const StyledHead = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  gap: 12px;
  padding: 12px 16px;
`;

const StyledMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledLine = styled.div`
  align-items: baseline;
  display: flex;
  gap: 8px;
`;

const StyledFrom = styled.span<{ isUnread: boolean }>`
  color: ${ROBOOST_UI_THEME.text};
  font-size: 14px;
  font-weight: ${({ isUnread }) => (isUnread ? 600 : 400)};
`;

const StyledTime = styled.span`
  color: ${ROBOOST_UI_THEME.textMuted};
  flex: none;
  font-size: 12px;
  margin-left: auto;
  white-space: nowrap;
`;

const StyledUnreadDot = styled.span`
  align-self: center;
  background: ${ROBOOST_UI_THEME.accent};
  border-radius: 999px;
  flex: none;
  height: 7px;
  width: 7px;
`;

const StyledSubject = styled.div`
  color: ${ROBOOST_UI_THEME.text};
  font-size: 13px;
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledSnippet = styled.div`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: ${ROBOOST_UI_THEME.textMuted};
  display: -webkit-box;
  font-size: 13px;
  line-height: 18px;
  overflow: hidden;
`;

const StyledCaret = styled.span<{ isOpen: boolean }>`
  color: ${ROBOOST_UI_THEME.textMuted};
  display: inline-flex;
  flex: none;
  transform: ${({ isOpen }) => (isOpen ? 'rotate(180deg)' : 'none')};
  transition: transform 0.12s;
`;

const StyledBody = styled.div`
  border-top: 1px solid ${ROBOOST_UI_THEME.borderSubtle};
  padding: 0 16px 16px;
`;

const StyledMeta = styled.div`
  color: ${ROBOOST_UI_THEME.textMuted};
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  gap: 4px 12px;
  padding: 12px 0;

  b {
    color: ${ROBOOST_UI_THEME.textSecondary};
    font-weight: 500;
  }
`;

const StyledText = styled.div`
  color: ${ROBOOST_UI_THEME.text};
  font-size: 14px;
  line-height: 21px;
  white-space: pre-wrap;

  p {
    margin: 0 0 12px;
  }
`;

const StyledActions = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 12px;
`;

export type EmailParty = {
  name: string;
  email?: string;
  avatar?: string;
  tone?: RoboostAvatarTone;
};

export type EmailCardProps = {
  from: EmailParty;
  fromLabel?: ReactNode;
  to?: ReactNode;
  subject: ReactNode;
  time: ReactNode;
  snippet?: string;
  body?: ReactNode;
  unread?: boolean;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  actions?: ReactNode;
};

export const EmailCard = ({
  from,
  fromLabel,
  to,
  subject,
  time,
  snippet,
  body,
  unread = false,
  expanded,
  defaultExpanded = false,
  onToggle,
  actions,
}: EmailCardProps) => {
  const { t } = useLingui();
  const [uncontrolledExpanded, setUncontrolledExpanded] =
    useState(defaultExpanded);
  const isOpen = expanded ?? uncontrolledExpanded;

  const toggle = () => {
    if (expanded === undefined) {
      setUncontrolledExpanded(!isOpen);
    }
    onToggle?.(!isOpen);
  };

  return (
    <StyledCard>
      <StyledHead
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
          }
        }}
      >
        <Avatar name={from.name} src={from.avatar} size="md" tone={from.tone} />
        <StyledMain>
          <StyledLine>
            {unread && <StyledUnreadDot />}
            <StyledFrom isUnread={unread}>{fromLabel ?? from.name}</StyledFrom>
            <StyledTime>{time}</StyledTime>
          </StyledLine>
          <StyledSubject>{subject}</StyledSubject>
          {!isOpen && snippet !== undefined && (
            <StyledSnippet>— {snippet}</StyledSnippet>
          )}
        </StyledMain>
        <StyledCaret isOpen={isOpen}>
          <Icon name="caret" size={16} />
        </StyledCaret>
      </StyledHead>
      {isOpen && (
        <StyledBody>
          <StyledMeta>
            <span>
              <b>{t`From`} </b>
              {from.name}
              {from.email !== undefined ? ` <${from.email}>` : ''}
            </span>
            {to !== undefined && (
              <span>
                <b>{t`To`} </b>
                {to}
              </span>
            )}
          </StyledMeta>
          <StyledText>{body}</StyledText>
          {actions !== undefined && <StyledActions>{actions}</StyledActions>}
        </StyledBody>
      )}
    </StyledCard>
  );
};
