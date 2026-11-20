import { getEmailAddressNames } from '@/activities/unified-emails/utils/getEmailAddressNames';
import { RoboostActivityCard } from '@/roboost-app/components/RoboostActivityCard';
import { type RoboostFeedItem } from '@/roboost-app/types/RoboostFeedItem';
import { formatRoboostDateTime } from '@/roboost-app/utils/formatRoboostDateTime';
import { EmailCard } from '@/roboost-ui/components/EmailCard';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';

type RoboostFeedItemViewProps = {
  item: RoboostFeedItem;
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
};

export const RoboostFeedItemView = ({
  item,
  isExpanded,
  onToggleExpanded,
}: RoboostFeedItemViewProps) => {
  const { t } = useLingui();
  const time = formatRoboostDateTime(item.date);
  const description = isNonEmptyString(item.body.trim())
    ? item.body
    : undefined;

  switch (item.kind) {
    case 'email': {
      const email = item.email;

      if (email === undefined) {
        return null;
      }
      const senderName =
        email.direction === 'INCOMING'
          ? (getEmailAddressNames(email.from)[0] ?? '')
          : isNonEmptyString(email.loggedByName)
            ? email.loggedByName
            : (getEmailAddressNames(email.from)[0] ?? '');
      const recipients = getEmailAddressNames(email.to).join(', ');
      const subject = item.title;
      const body = isNonEmptyString(email.bodyMarkdown)
        ? email.bodyMarkdown
        : (email.bodyPreview ?? '');

      return (
        <EmailCard
          from={{ name: senderName, tone: 'accent' }}
          fromLabel={
            isNonEmptyString(recipients)
              ? `${senderName} → ${recipients}`
              : senderName
          }
          to={email.to ?? undefined}
          subject={
            <>
              <b>{t`Email`}</b> – {subject}
            </>
          }
          time={time}
          snippet={email.bodyPreview ?? undefined}
          body={body}
          expanded={isExpanded}
          onToggle={onToggleExpanded}
        />
      );
    }
    case 'tracking': {
      const email = item.email;
      const verb =
        (email?.clickCount ?? 0) > 0 && (email?.openCount ?? 0) === 0
          ? t`clicked a link in`
          : t`opened`;

      return (
        <RoboostActivityCard
          icon="mail"
          tone="info"
          title={
            <>
              <b>{item.title}</b> {verb} “{item.body}”
            </>
          }
          time={time}
          description={item.meta}
        />
      );
    }
    case 'note':
      return (
        <RoboostActivityCard
          icon="note"
          tone="accent"
          title={
            <>
              <b>{t`Note`}</b>
              {isNonEmptyString(item.ownerName)
                ? ` ${t`added by`} ${item.ownerName}`
                : ''}
              {isNonEmptyString(item.title) ? ` — ${item.title}` : ''}
            </>
          }
          time={time}
          description={description}
        />
      );
    case 'task':
      return (
        <RoboostActivityCard
          icon="tasks"
          tone="neutral"
          title={
            <>
              <b>{t`Task`}</b> — {item.title}
            </>
          }
          time={`${t`Due`} ${time}`}
          description={[
            isNonEmptyString(item.ownerName)
              ? `${t`Assigned to`} ${item.ownerName}`
              : t`Unassigned`,
            item.meta,
          ]
            .filter(isNonEmptyString)
            .join(' · ')}
        />
      );
    case 'call':
      return (
        <RoboostActivityCard
          icon="phone"
          tone="success"
          title={
            <>
              <b>{t`Call`}</b>
              {isNonEmptyString(item.title) ? ` — ${item.title}` : ''}
              {isNonEmptyString(item.ownerName) ? ` · ${item.ownerName}` : ''}
            </>
          }
          time={time}
          description={[item.meta, description]
            .filter(isNonEmptyString)
            .join(' · ')}
        />
      );
    case 'meeting':
      return (
        <RoboostActivityCard
          icon="calendar"
          tone="info"
          title={
            <>
              <b>{t`Meeting`}</b> — {item.title}
            </>
          }
          time={time}
          description={[item.meta, description]
            .filter(isNonEmptyString)
            .join(' · ')}
        />
      );
    default:
      return null;
  }
};
