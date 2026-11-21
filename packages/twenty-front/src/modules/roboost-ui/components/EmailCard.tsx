import { Avatar } from '@/roboost-ui/components/Avatar';
import { Icon } from '@/roboost-ui/components/Icon';
import { type RoboostAvatarTone } from '@/roboost-ui/types/RoboostAvatarTone';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useState } from 'react';

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
    <div className={cx('rb-email', unread && 'is-unread')}>
      <div
        className="rb-email-head"
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
        <div className="rb-email-main">
          <div className="rb-email-line1">
            {unread && <span className="rb-email-unread-dot" />}
            <span className="rb-email-from">{fromLabel ?? from.name}</span>
            <span className="rb-email-time">{time}</span>
          </div>
          <div className="rb-email-subject">{subject}</div>
          {!isOpen && snippet !== undefined && (
            <div className="rb-email-snippet rb-email-snippet-clamp">
              — {snippet}
            </div>
          )}
        </div>
        <span
          className="rb-muted"
          style={{
            display: 'inline-flex',
            flex: 'none',
            transform: isOpen ? 'rotate(180deg)' : undefined,
          }}
        >
          <Icon name="caret" size={16} />
        </span>
      </div>
      {isOpen && (
        <div className="rb-email-body">
          <div className="rb-email-meta">
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
          </div>
          <div className="rb-email-text">{body}</div>
          {actions !== undefined && (
            <div className="rb-email-actions">{actions}</div>
          )}
        </div>
      )}
    </div>
  );
};
