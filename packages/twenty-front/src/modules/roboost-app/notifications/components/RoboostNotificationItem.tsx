import { type RoboostNotification } from '@/roboost-app/notifications/types/RoboostNotification';
import { RoboostNotificationChips } from '@/roboost-app/notifications/components/RoboostNotificationChips';
import { formatRoboostTimeAgo } from '@/roboost-app/notifications/utils/formatRoboostTimeAgo';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';

type RoboostNotificationItemProps = {
  notification: RoboostNotification;
  isSelected: boolean;
  isHovered: boolean;
  isTrash: boolean;
  onSelect: (selected: boolean) => void;
  onOpen: () => void;
  onToggleRead: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
  onHover: (element: HTMLElement | null) => void;
  onNavigate: () => void;
};

export const RoboostNotificationItem = ({
  notification,
  isSelected,
  isHovered,
  isTrash,
  onSelect,
  onOpen,
  onToggleRead,
  onTrash,
  onRestore,
  onDeleteForever,
  onHover,
  onNavigate,
}: RoboostNotificationItemProps) => {
  const { t } = useLingui();

  return (
    <div
      className={cx(
        'rb-notif-item',
        !notification.isRead && 'is-unread',
        isHovered && 'is-hovered',
        isSelected && 'is-selected',
      )}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onOpen();
        }
      }}
      onMouseEnter={(event) => onHover(event.currentTarget)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className="rb-notif-check"
        onClick={(event) => event.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          aria-label={t`Select notification`}
          onChange={onSelect}
        />
      </div>
      <div className="rb-notif-main">
        <div className="rb-notif-titleline">
          <span className="rb-notif-title rb-truncate">
            {notification.title}
          </span>
          <span className="rb-notif-time">
            {formatRoboostTimeAgo(notification.createdAt)}
          </span>
        </div>
        <div className="rb-notif-body rb-truncate">{notification.body}</div>
        <RoboostNotificationChips
          notification={notification}
          onNavigate={onNavigate}
        />
      </div>
      <div
        className="rb-notif-actions"
        onClick={(event) => event.stopPropagation()}
      >
        {isTrash ? (
          <>
            <button
              type="button"
              className="rb-notif-iconbtn"
              aria-label={t`Restore`}
              title={t`Restore`}
              onClick={onRestore}
            >
              <Icon name="refresh" size={14} />
            </button>
            <button
              type="button"
              className="rb-notif-iconbtn"
              aria-label={t`Delete permanently`}
              title={t`Delete permanently`}
              onClick={onDeleteForever}
            >
              <Icon name="trash" size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="rb-notif-iconbtn"
              aria-label={
                notification.isRead ? t`Mark as unread` : t`Mark as read`
              }
              title={notification.isRead ? t`Mark as unread` : t`Mark as read`}
              onClick={onToggleRead}
            >
              <Icon name="mail" size={14} />
            </button>
            <button
              type="button"
              className="rb-notif-iconbtn"
              aria-label={t`Delete`}
              title={t`Delete`}
              onClick={onTrash}
            >
              <Icon name="trash" size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
