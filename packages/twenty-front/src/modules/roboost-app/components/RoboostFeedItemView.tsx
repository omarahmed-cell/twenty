import { RoboostActivityCard } from '@/roboost-app/components/RoboostActivityCard';
import { RoboostActivityItemCard } from '@/roboost-app/timeline/components/RoboostActivityItemCard';
import { RoboostEmailItemCard } from '@/roboost-app/timeline/components/RoboostEmailItemCard';
import { type RoboostEmailContact } from '@/roboost-app/timeline/hooks/useRoboostEmailContacts';
import { type RoboostFeedItem } from '@/roboost-app/types/RoboostFeedItem';
import { formatRoboostDateTime } from '@/roboost-app/utils/formatRoboostDateTime';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { type RoboostTone } from '@/roboost-ui/types/RoboostTone';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { type ReactNode } from 'react';
import { isDefined } from 'twenty-shared/utils';

export type RoboostFeedThreadEmail = { id: string; date: string; from: string };

type RoboostFeedItemViewProps = {
  item: RoboostFeedItem;
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
  isPinned: boolean;
  onTogglePin: () => void;
  onChanged: () => void;
  contactByEmail: Map<string, RoboostEmailContact>;
  thread: RoboostFeedThreadEmail[];
};

const COMMUNICATION_ICON_BY_TYPE_KEY: Partial<
  Record<RoboostFeedItem['typeKey'], RoboostIconName>
> = {
  whatsapp: 'whatsapp',
  linkedin: 'linkedin',
  sms: 'sms',
};

export const RoboostFeedItemView = ({
  item,
  isExpanded,
  onToggleExpanded,
  isPinned,
  onTogglePin,
  onChanged,
  contactByEmail,
  thread,
}: RoboostFeedItemViewProps) => {
  const { t } = useLingui();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const time = formatRoboostDateTime(item.date);
  const by = isNonEmptyString(item.ownerName)
    ? ` ${t`by`} ${item.ownerName}`
    : '';

  const activityCard = (
    icon: RoboostIconName,
    tone: RoboostTone,
    title: ReactNode,
    cardTime: string = time,
  ) =>
    isDefined(item.recordId) && isDefined(item.objectNameSingular) ? (
      <RoboostActivityItemCard
        objectNameSingular={item.objectNameSingular}
        recordId={item.recordId}
        icon={icon}
        tone={tone}
        title={title}
        time={cardTime}
        preview={item.body}
        isExpanded={isExpanded}
        onToggleExpanded={onToggleExpanded}
        isPinned={isPinned}
        onTogglePin={onTogglePin}
        onChanged={onChanged}
      />
    ) : null;

  switch (item.kind) {
    case 'email':
      return isDefined(item.email) ? (
        <RoboostEmailItemCard
          email={item.email}
          subject={item.title}
          time={time}
          contactByEmail={contactByEmail}
          thread={thread}
          isExpanded={isExpanded}
          onToggleExpanded={onToggleExpanded}
        />
      ) : null;
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
          onOpen={
            isDefined(email)
              ? () =>
                  openRecordInSidePanel({
                    recordId: email.id,
                    objectNameSingular: 'email',
                  })
              : undefined
          }
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
      return activityCard(
        'note',
        'accent',
        <>
          <b>{t`Note`}</b>
          {by}
          {isNonEmptyString(item.title) ? ` · ${item.title}` : ''}
        </>,
      );
    case 'task':
      return activityCard(
        'tasks',
        'neutral',
        <>
          <b>{t`Task`}</b> · {item.title}
          {isNonEmptyString(item.ownerName)
            ? ` · ${t`assigned to`} ${item.ownerName}`
            : ''}
        </>,
        `${t`Due`} ${time}`,
      );
    case 'call':
      return activityCard(
        'phone',
        'success',
        <>
          <b>
            {t`Logged call`}
            {isNonEmptyString(item.meta) ? ` - ${item.meta}` : ''}
          </b>
          {by}
        </>,
      );
    case 'meeting':
      return activityCard(
        'calendar',
        'info',
        <>
          <b>{t`Meeting`}</b> · {item.title}
          {isNonEmptyString(item.meta) ? ` · ${item.meta}` : ''}
        </>,
      );
    case 'communication':
      return activityCard(
        COMMUNICATION_ICON_BY_TYPE_KEY[item.typeKey] ?? 'whatsapp',
        'success',
        <>
          <b>{item.title}</b>
          {by}
        </>,
      );
    case 'update':
      return (
        <RoboostActivityCard
          icon="history"
          tone="neutral"
          title={
            <>
              <b>{item.title}</b>
              {by}
            </>
          }
          time={time}
          description={item.body}
        />
      );
    default:
      return null;
  }
};
