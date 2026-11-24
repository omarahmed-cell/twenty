import { type RoboostNotification } from '@/roboost-app/notifications/types/RoboostNotification';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Link } from 'react-router-dom';

const VISIBLE_CHIPS = 2;

type RoboostNotificationChipsProps = {
  notification: Pick<RoboostNotification, 'relatedRecords' | 'relatedCount'>;
  onNavigate?: () => void;
};

// The first two records by name, then "+N" for the rest of the batch
export const RoboostNotificationChips = ({
  notification,
  onNavigate,
}: RoboostNotificationChipsProps) => {
  const records = notification.relatedRecords ?? [];
  const visible = records.slice(0, VISIBLE_CHIPS);
  const hiddenCount =
    Math.max(notification.relatedCount, records.length) - visible.length;

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="rb-notif-chips">
      {visible.map((record) => (
        <Link
          key={record.id}
          className="rb-notif-chip"
          to={`/object/${record.objectNameSingular}/${record.id}`}
          title={record.name}
          onClick={(event) => {
            event.stopPropagation();
            onNavigate?.();
          }}
        >
          <Avatar name={record.name} size="xs" />
          <span className="rb-truncate">{record.name}</span>
        </Link>
      ))}
      {hiddenCount > 0 && (
        <span className="rb-notif-chip is-count">+{hiddenCount}</span>
      )}
    </div>
  );
};
