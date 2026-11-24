import { useRoboostDownloadTransferFile } from '@/roboost-app/data-transfer/hooks/useRoboostDownloadTransferFile';
import { RoboostNotificationChips } from '@/roboost-app/notifications/components/RoboostNotificationChips';
import { RoboostNotificationItem } from '@/roboost-app/notifications/components/RoboostNotificationItem';
import { useRoboostNotificationList } from '@/roboost-app/notifications/hooks/useRoboostNotificationList';
import {
  type RoboostNotification,
  type RoboostNotificationTab,
  type RoboostNotificationType,
} from '@/roboost-app/notifications/types/RoboostNotification';
import { getRoboostNotificationHref } from '@/roboost-app/notifications/utils/getRoboostNotificationHref';
import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { FloatingPanel } from '@/roboost-ui/components/FloatingPanel';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu } from '@/roboost-ui/components/Menu';
import { Modal } from '@/roboost-ui/components/Modal';
import { Tabs } from '@/roboost-ui/components/Tabs';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';

// Leaving a row for its preview crosses a small gap; the preview stays while the pointer travels
const PREVIEW_CLOSE_DELAY_MS = 180;
const LOAD_MORE_DISTANCE_PX = 120;

type RoboostNotificationsPanelProps = {
  unreadCount: number;
  onClose: () => void;
  onCountsChanged: () => void;
};

export const RoboostNotificationsPanel = ({
  unreadCount,
  onClose,
  onCountsChanged,
}: RoboostNotificationsPanelProps) => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [closeTimer, setCloseTimer] = useState<number | null>(null);
  const [tab, setTab] = useState<RoboostNotificationTab>('UNREAD');
  const [type, setType] = useState<RoboostNotificationType | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [hovered, setHovered] = useState<{
    id: string;
    element: HTMLElement;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    { ids: string[] } | { all: true } | null
  >(null);
  const { downloadFromNotification } = useRoboostDownloadTransferFile();
  const { items, hasMore, isLoading, loadMore, apply } =
    useRoboostNotificationList({ tab, type, isOpen: true });

  const typeLabels: Record<RoboostNotificationType | 'all', string> = {
    all: t`All`,
    assign: t`Assign`,
    export: t`Export`,
    import: t`Import`,
    task: t`Task`,
  };
  const isTrash = tab === 'TRASH';
  const hasSelection = isAllSelected || selectedIds.length > 0;
  const hoveredNotification = items.find((item) => item.id === hovered?.id);

  const resetSelection = () => {
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  const run = async (
    action: 'READ' | 'UNREAD' | 'TRASH' | 'RESTORE' | 'DELETE',
    ids?: string[],
  ) => {
    await apply(
      isDefined(ids)
        ? { action, ids }
        : isAllSelected
          ? { action, allInTab: tab }
          : { action, ids: selectedIds },
    );
    resetSelection();
    onCountsChanged();
  };

  const openNotification = async (notification: RoboostNotification) => {
    const href = getRoboostNotificationHref(notification);

    if (!notification.isRead) {
      await apply({ action: 'READ', ids: [notification.id] });
      onCountsChanged();
    }
    if (isDefined(href)) {
      onClose();
      navigate(href);
    }
  };

  const keepPreview = () => {
    if (closeTimer !== null) {
      window.clearTimeout(closeTimer);
      setCloseTimer(null);
    }
  };

  const hoverRow = (id: string, element: HTMLElement | null) => {
    keepPreview();
    if (element !== null) {
      setHovered({ id, element });
      return;
    }
    setCloseTimer(
      window.setTimeout(() => setHovered(null), PREVIEW_CLOSE_DELAY_MS),
    );
  };

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;

      if (
        !(target instanceof Element) ||
        panelRef.current?.contains(target) === true ||
        target.closest('.rb-floating, .rb-modal-scrim, .rb-notif-bell') !== null
      ) {
        return;
      }
      onClose();
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);

    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [onClose]);

  const emptyText =
    tab === 'UNREAD'
      ? t`You're all caught up. New notifications show up here.`
      : tab === 'TRASH'
        ? t`Trash is empty. Deleted notifications stay here for 30 days.`
        : t`No notifications yet.`;

  return createPortal(
    <div className="rb-ui rb-notif-layer">
      <aside
        ref={panelRef}
        className="rb-notif-panel"
        role="dialog"
        aria-label={t`Notifications`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
      >
        <div className="rb-notif-head">
          <h2 className="rb-notif-heading">{t`Notifications`}</h2>
          <button
            type="button"
            className="rb-notif-close"
            aria-label={t`Close`}
            onClick={onClose}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <Tabs
          className="rb-notif-tabs"
          value={tab}
          onChange={(id) => {
            setTab(id as RoboostNotificationTab);
            resetSelection();
            setHovered(null);
          }}
          tabs={[
            { id: 'UNREAD', label: t`Unread`, count: unreadCount },
            { id: 'ALL', label: t`All` },
            { id: 'TRASH', label: t`Trash` },
          ]}
        />
        <div className="rb-notif-toolbar">
          <Checkbox
            checked={isAllSelected}
            indeterminate={!isAllSelected && selectedIds.length > 0}
            onChange={(checked) => {
              setIsAllSelected(checked);
              setSelectedIds([]);
            }}
          >
            {t`Select all`}
          </Checkbox>
          {hasSelection ? (
            <div className="rb-notif-bulk">
              {isTrash ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => run('RESTORE')}
                  >
                    {t`Restore`}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    tone="danger"
                    onClick={() =>
                      setPendingDelete(
                        isAllSelected ? { all: true } : { ids: selectedIds },
                      )
                    }
                  >
                    {t`Delete permanently`}
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => run('READ')}>
                    {t`Mark as read`}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => run('UNREAD')}
                  >
                    {t`Mark as unread`}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    tone="danger"
                    onClick={() => run('TRASH')}
                  >
                    {t`Delete`}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <Menu
              align="right"
              minWidth={160}
              entries={(
                ['all', 'assign', 'export', 'import', 'task'] as const
              ).map((key) => ({
                id: key,
                label: typeLabels[key],
                isSelected: (type ?? 'all') === key,
                onSelect: () => {
                  setType(key === 'all' ? null : key);
                  resetSelection();
                },
              }))}
              trigger={({ toggle, isOpen }) => (
                <button
                  type="button"
                  className="rb-notif-type"
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                  onClick={toggle}
                >
                  <span>{t`Type:`}</span>
                  <b>{typeLabels[type ?? 'all']}</b>
                  <Icon name="caret" size={12} />
                </button>
              )}
            />
          )}
        </div>
        <div
          className="rb-notif-list"
          onScroll={(event) => {
            const list = event.currentTarget;

            if (
              list.scrollHeight - list.scrollTop - list.clientHeight <
              LOAD_MORE_DISTANCE_PX
            ) {
              loadMore();
            }
          }}
        >
          {items.map((notification) => (
            <RoboostNotificationItem
              key={notification.id}
              notification={notification}
              isTrash={isTrash}
              isHovered={hovered?.id === notification.id}
              isSelected={
                isAllSelected || selectedIds.includes(notification.id)
              }
              onSelect={(selected) => {
                if (isAllSelected) {
                  setIsAllSelected(false);
                  setSelectedIds(
                    items
                      .map((item) => item.id)
                      .filter((id) => id !== notification.id),
                  );
                  return;
                }
                setSelectedIds(
                  selected
                    ? [...selectedIds, notification.id]
                    : selectedIds.filter((id) => id !== notification.id),
                );
              }}
              onOpen={() => openNotification(notification)}
              onToggleRead={() =>
                run(notification.isRead ? 'UNREAD' : 'READ', [notification.id])
              }
              onTrash={() => run('TRASH', [notification.id])}
              onRestore={() => run('RESTORE', [notification.id])}
              onDeleteForever={() =>
                setPendingDelete({ ids: [notification.id] })
              }
              onHover={(element) => hoverRow(notification.id, element)}
              onNavigate={onClose}
            />
          ))}
          {!isLoading && items.length === 0 && (
            <div className="rb-notif-empty">
              <Icon name="bell" size={22} />
              <span>{emptyText}</span>
            </div>
          )}
          {isLoading && <div className="rb-notif-loading">{t`Loading…`}</div>}
          {!isLoading && hasMore && <div className="rb-notif-more" />}
        </div>
      </aside>
      {isDefined(hoveredNotification) && isDefined(hovered) && (
        <FloatingPanel
          anchor={hovered.element}
          side="left"
          minWidth={300}
          maxHeight={null}
          panelRef={previewRef}
          className="rb-floating-surface rb-notif-preview"
          onMouseEnter={keepPreview}
          onMouseLeave={() => hoverRow(hoveredNotification.id, null)}
        >
          <div className="rb-notif-preview-title">
            {hoveredNotification.title}
          </div>
          <div className="rb-notif-preview-actions">
            {isDefined(getRoboostNotificationHref(hoveredNotification)) && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openNotification(hoveredNotification)}
              >
                {hoveredNotification.actionLabel ?? t`View`}
              </Button>
            )}
            {isNonEmptyString(hoveredNotification.downloadUrl) && (
              <Button
                size="sm"
                variant="secondary"
                icon="download"
                onClick={() =>
                  downloadFromNotification(
                    hoveredNotification.downloadUrl ?? '',
                  )
                }
              >
                {t`Download`}
              </Button>
            )}
          </div>
          <RoboostNotificationChips
            notification={hoveredNotification}
            onNavigate={onClose}
          />
          <p className="rb-notif-preview-body">{hoveredNotification.body}</p>
        </FloatingPanel>
      )}
      {pendingDelete !== null && (
        <Modal
          title={t`Delete permanently?`}
          tone="danger"
          width={420}
          onClose={() => setPendingDelete(null)}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setPendingDelete(null)}
              >
                {t`Cancel`}
              </Button>
              <Button
                variant="primary"
                tone="danger"
                onClick={async () => {
                  const target = pendingDelete;

                  setPendingDelete(null);
                  await run('DELETE', 'ids' in target ? target.ids : undefined);
                }}
              >
                {t`Delete permanently`}
              </Button>
            </>
          }
        >
          {t`These notifications are removed for good. This can't be undone.`}
        </Modal>
      )}
    </div>,
    document.body,
  );
};
