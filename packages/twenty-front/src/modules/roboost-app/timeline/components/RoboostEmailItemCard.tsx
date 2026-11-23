import { type RoboostEmailContact } from '@/roboost-app/timeline/hooks/useRoboostEmailContacts';
import {
  parseRoboostEmailAddresses,
  type RoboostEmailAddress,
} from '@/roboost-app/timeline/utils/parseRoboostEmailAddresses';
import { renderRoboostEmailText } from '@/roboost-app/timeline/utils/renderRoboostEmailText';
import { splitRoboostEmailBody } from '@/roboost-app/timeline/utils/splitRoboostEmailBody';
import { type RoboostFeedEmail } from '@/roboost-app/types/RoboostFeedItem';
import { formatRoboostDateTime } from '@/roboost-app/utils/formatRoboostDateTime';
import { Icon } from '@/roboost-ui/components/Icon';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const VISIBLE_RECIPIENTS = 3;

type ThreadEmail = { id: string; date: string; from: string };

type RoboostEmailItemCardProps = {
  email: RoboostFeedEmail;
  subject: string;
  time: string;
  contactByEmail: Map<string, RoboostEmailContact>;
  thread: ThreadEmail[];
  isExpanded: boolean;
  onToggleExpanded: (isExpanded: boolean) => void;
};

const AddressLink = ({
  address,
  contact,
}: {
  address: RoboostEmailAddress;
  contact: RoboostEmailContact | undefined;
}) =>
  isDefined(contact) &&
  contact.objectNameSingular !== CoreObjectNameSingular.WorkspaceMember ? (
    <Link
      className="rb-emailc-addr is-link"
      to={`/object/${contact.objectNameSingular}/${contact.id}`}
      title={address.email}
      onClick={(event) => event.stopPropagation()}
    >
      {address.name}
    </Link>
  ) : (
    <span
      className={cx('rb-emailc-addr', isDefined(contact) && 'is-member')}
      title={address.email}
    >
      {address.name}
    </span>
  );

export const RoboostEmailItemCard = ({
  email,
  subject,
  time,
  contactByEmail,
  thread,
  isExpanded,
  onToggleExpanded,
}: RoboostEmailItemCardProps) => {
  const { t } = useLingui();
  const [showQuoted, setShowQuoted] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const sender = parseRoboostEmailAddresses(email.from)[0];
  const recipients = [
    ...parseRoboostEmailAddresses(email.to),
    ...parseRoboostEmailAddresses(email.cc),
  ];
  const visibleRecipients = recipients.slice(0, VISIBLE_RECIPIENTS);
  const hiddenRecipients = recipients.slice(VISIBLE_RECIPIENTS);
  const { main, quoted } = splitRoboostEmailBody(
    email.bodyMarkdown ?? email.bodyPreview ?? '',
  );
  const otherThreadEmails = thread.filter((item) => item.id !== email.id);
  const toggle = () => onToggleExpanded(!isExpanded);
  const isOutgoing = email.direction !== 'INCOMING';

  return (
    <div className={cx('rb-actc rb-emailc', isExpanded && 'is-open')}>
      <div className="rb-actc-head">
        <button
          type="button"
          className="rb-actc-toggle"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? t`Collapse` : t`Expand`}
          onClick={toggle}
        >
          <Icon name="caret" size={14} />
        </button>
        <span className="rb-actc-icon rb-tone-info">
          <Icon name="mail" size={14} />
        </span>
        <div
          className="rb-actc-title"
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggle();
            }
          }}
        >
          <b>{isOutgoing ? t`Email` : t`Incoming email`}</b> – {subject}
        </div>
        <span className="rb-actc-time">{time}</span>
      </div>
      <div className="rb-emailc-parties">
        {isDefined(sender) && (
          <AddressLink
            address={sender}
            contact={contactByEmail.get(sender.email)}
          />
        )}
        {recipients.length > 0 && <span className="rb-emailc-arrow">→</span>}
        <span className="rb-emailc-to">
          {visibleRecipients.map((address, index) => (
            <Fragment key={`${address.email}-${index}`}>
              {index > 0 && ', '}
              <AddressLink
                address={address}
                contact={contactByEmail.get(address.email)}
              />
            </Fragment>
          ))}
        </span>
        {hiddenRecipients.length > 0 && (
          <span
            className="rb-emailc-more"
            title={hiddenRecipients.map(({ name }) => name).join(', ')}
          >
            … +{hiddenRecipients.length}
          </span>
        )}
      </div>
      {(email.openCount > 0 || email.clickCount > 0 || isOutgoing) && (
        <div className="rb-emailc-track">
          <span>
            <i className="rb-dot rb-dot-success" />
            {t`Opens`}: {email.openCount}
          </span>
          <span>
            <i className="rb-dot rb-dot-info" />
            {t`Clicks`}: {email.clickCount}
          </span>
        </div>
      )}
      {!isExpanded && (email.bodyPreview ?? main) !== '' && (
        <div className="rb-actc-preview" onClick={toggle}>
          {email.bodyPreview ?? main}
        </div>
      )}
      {isExpanded && (
        <div className="rb-emailc-body">
          {main === '' ? (
            <span className="rb-muted">{t`This email has no body.`}</span>
          ) : (
            renderRoboostEmailText(main)
          )}
          {quoted !== '' &&
            (showQuoted ? (
              <div className="rb-emailc-quoted">
                {renderRoboostEmailText(quoted)}
              </div>
            ) : (
              <button
                type="button"
                className="rb-link rb-emailc-link"
                onClick={() => setShowQuoted(true)}
              >
                {t`See more`}
              </button>
            ))}
          {otherThreadEmails.length > 0 && (
            <>
              <button
                type="button"
                className="rb-link rb-emailc-link"
                onClick={() => setShowThread(!showThread)}
              >
                {t`View thread (${thread.length})`}
              </button>
              {showThread && (
                <ul className="rb-emailc-thread">
                  {thread.map((item) => (
                    <li
                      key={item.id}
                      className={cx(item.id === email.id && 'is-current')}
                    >
                      <span>{item.from}</span>
                      <span className="rb-muted">
                        {formatRoboostDateTime(item.date)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
