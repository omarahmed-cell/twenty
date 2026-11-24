import { ROBOOST_NOTIFICATION_COUNTS } from '@/roboost-app/notifications/graphql/roboostNotificationQueries';
import { RoboostNotificationsPanel } from '@/roboost-app/notifications/components/RoboostNotificationsPanel';
import { roboostNotificationsOpenState } from '@/roboost-app/notifications/states/roboostNotificationsOpenState';
import { Icon } from '@/roboost-ui/components/Icon';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';

// No push channel reaches the browser for these, so the badge polls
const COUNT_POLL_INTERVAL_MS = 30_000;
const MAX_BADGE = 99;

export const RoboostNotificationBell = () => {
  const { t } = useLingui();
  const [roboostNotificationsOpen, setRoboostNotificationsOpen] = useAtomState(
    roboostNotificationsOpenState,
  );
  const { data, refetch } = useQuery<{
    roboostNotificationCounts: { unread: number; all: number; trash: number };
  }>(ROBOOST_NOTIFICATION_COUNTS, {
    pollInterval: COUNT_POLL_INTERVAL_MS,
    fetchPolicy: 'cache-and-network',
  });
  const unread = data?.roboostNotificationCounts.unread ?? 0;
  const badge = unread > MAX_BADGE ? `${MAX_BADGE}+` : String(unread);

  return (
    <>
      <button
        type="button"
        className="rb-topbar-iconbtn rb-notif-bell"
        aria-label={
          unread > 0 ? t`Notifications, ${unread} unread` : t`Notifications`
        }
        title={t`Notifications`}
        aria-expanded={roboostNotificationsOpen}
        onClick={() => {
          setRoboostNotificationsOpen(!roboostNotificationsOpen);
          refetch();
        }}
      >
        <Icon name="bell" />
        {unread > 0 && <span className="rb-notif-badge">{badge}</span>}
      </button>
      {roboostNotificationsOpen && (
        <RoboostNotificationsPanel
          unreadCount={unread}
          onClose={() => setRoboostNotificationsOpen(false)}
          onCountsChanged={() => refetch()}
        />
      )}
    </>
  );
};
