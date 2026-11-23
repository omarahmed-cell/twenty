import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
import { orderRoboostViews } from '@/roboost-app/list/utils/orderRoboostViews';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { Modal } from '@/roboost-ui/components/Modal';
import { cx } from '@/roboost-ui/utils/cx';
import { usePerformViewApiPersist } from '@/views/hooks/internal/usePerformViewApiPersist';
import { usePerformViewApiUpdate } from '@/views/hooks/internal/usePerformViewApiUpdate';
import { type View } from '@/views/types/View';
import { ViewKey } from '@/views/types/ViewKey';
import { resolveViewNamePlaceholders } from '@/views/utils/resolveViewNamePlaceholders';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { ViewVisibility } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';
import { ViewType } from '~/generated-metadata/graphql';

const VISIBLE_TAB_COUNT = 6;

const formatCount = (count: number) =>
  count >= 1000
    ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`
    : String(count);

type RoboostViewTabsProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  views: View[];
  activeViewId: string | undefined;
  activeCount: number | undefined;
  isDirty: boolean;
  onChange: (viewId: string) => void;
  onCreate: () => void;
  onClone: () => void;
  onSave: () => void;
  onReset: () => void;
};

export const RoboostViewTabs = ({
  objectMetadataItem,
  views,
  activeViewId,
  activeCount,
  isDirty,
  onChange,
  onCreate,
  onClone,
  onSave,
  onReset,
}: RoboostViewTabsProps) => {
  const { t } = useLingui();
  const { getUserVar, getWorkspaceDefault, setUserVar, setWorkspaceDefault } =
    useRoboostUserVars();
  const { performViewApiUpdate } = usePerformViewApiUpdate();
  const { performViewApiDestroy } = usePerformViewApiPersist();
  const { copyToClipboard } = useCopyToClipboard();
  const [draggedViewId, setDraggedViewId] = useState<string | null>(null);
  const [renamingView, setRenamingView] = useState<View | null>(null);
  const [newName, setNewName] = useState('');
  const [deletingView, setDeletingView] = useState<View | null>(null);
  const orderKey = `roboost.viewOrder.${objectMetadataItem.id}`;
  const savedOrder =
    getUserVar<string[]>(orderKey) ?? getWorkspaceDefault<string[]>(orderKey);

  const tableViews = orderRoboostViews(
    views.filter((view) => view.type !== ViewType.KANBAN),
    savedOrder,
  );
  const activeIndex = tableViews.findIndex((view) => view.id === activeViewId);
  const visibleViews =
    activeIndex >= VISIBLE_TAB_COUNT
      ? [...tableViews.slice(0, VISIBLE_TAB_COUNT - 1), tableViews[activeIndex]]
      : tableViews.slice(0, VISIBLE_TAB_COUNT);
  const overflowViews = tableViews.filter(
    (view) => !visibleViews.includes(view),
  );
  const getName = (view: View) =>
    resolveViewNamePlaceholders(view.name, objectMetadataItem);

  const dropOn = (targetViewId: string) => {
    if (!isDefined(draggedViewId) || draggedViewId === targetViewId) {
      return;
    }
    const ids = tableViews.map((view) => view.id);
    const from = ids.indexOf(draggedViewId);
    const to = ids.indexOf(targetViewId);

    ids.splice(to, 0, ...ids.splice(from, 1));
    setUserVar(orderKey, ids);
  };

  const renderMenu = (view: View) => (
    <Menu
      align="left"
      minWidth={240}
      entries={[
        {
          id: 'rename',
          label: t`Rename`,
          icon: 'pencil',
          onSelect: () => {
            setNewName(getName(view));
            setRenamingView(view);
          },
        },
        { id: 'sharing-heading', heading: t`Manage sharing` },
        {
          id: 'share-workspace',
          label: t`Everyone in the workspace`,
          icon: 'globe',
          isSelected: view.visibility !== ViewVisibility.UNLISTED,
          onSelect: () =>
            performViewApiUpdate({
              id: view.id,
              input: { visibility: ViewVisibility.WORKSPACE },
            }),
        },
        {
          id: 'share-me',
          label: t`Only me`,
          icon: 'user',
          isSelected: view.visibility === ViewVisibility.UNLISTED,
          isDisabled: view.key === ViewKey.INDEX,
          onSelect: () =>
            view.key !== ViewKey.INDEX &&
            performViewApiUpdate({
              id: view.id,
              input: { visibility: ViewVisibility.UNLISTED },
            }),
        },
        {
          id: 'copy-link',
          label: t`Copy link to view`,
          icon: 'link',
          onSelect: () => {
            const url = new URL(window.location.href);

            url.searchParams.set('viewId', view.id);
            copyToClipboard(url.toString(), t`Link copied`);
          },
        },
        { id: 'sep-1', isSeparator: true },
        {
          id: 'save',
          label: t`Save changes`,
          icon: 'check',
          isDisabled: !isDirty,
          onSelect: () => isDirty && onSave(),
        },
        {
          id: 'reset',
          label: t`Reset to last save`,
          icon: 'refresh',
          isDisabled: !isDirty,
          onSelect: () => isDirty && onReset(),
        },
        {
          id: 'clone',
          label: t`Clone to new view`,
          icon: 'copy',
          onSelect: onClone,
        },
        {
          id: 'order-default',
          label: t`Make this tab order the default`,
          icon: 'list',
          onSelect: () =>
            setWorkspaceDefault(
              orderKey,
              tableViews.map((candidate) => candidate.id),
            ),
        },
        { id: 'sep-2', isSeparator: true },
        {
          id: 'delete',
          label: t`Delete`,
          icon: 'trash',
          isDanger: true,
          isDisabled: view.key === ViewKey.INDEX,
          onSelect: () => view.key !== ViewKey.INDEX && setDeletingView(view),
        },
      ]}
      trigger={({ toggle, isOpen }) => (
        <span
          role="button"
          tabIndex={0}
          className="rb-vtab-menu"
          aria-label={t`View options`}
          aria-expanded={isOpen}
          onClick={(event) => {
            event.stopPropagation();
            toggle();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              toggle();
            }
          }}
        >
          <Icon name="more" size={14} />
        </span>
      )}
    />
  );

  return (
    <div className="rb-ls-tabs">
      {visibleViews.map((view) => (
        <div
          key={view.id}
          className={cx(
            'rb-vtab',
            view.id === activeViewId && 'is-on',
            view.id === draggedViewId && 'is-dragging',
          )}
          draggable
          onDragStart={() => setDraggedViewId(view.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => dropOn(view.id)}
          onDragEnd={() => setDraggedViewId(null)}
        >
          <button
            type="button"
            className="rb-vtab-btn"
            aria-pressed={view.id === activeViewId}
            onClick={() => onChange(view.id)}
          >
            {view.visibility === ViewVisibility.UNLISTED && (
              <Icon name="user" size={12} />
            )}
            {getName(view)}
            {view.id === activeViewId && activeCount !== undefined && (
              <span className="rb-vc">{formatCount(activeCount)}</span>
            )}
          </button>
          {view.id === activeViewId && renderMenu(view)}
        </div>
      ))}
      {overflowViews.length > 0 && (
        <Menu
          entries={overflowViews.map((view) => ({
            id: view.id,
            label: getName(view),
            onSelect: () => onChange(view.id),
          }))}
          trigger={({ toggle, isOpen }) => (
            <button
              type="button"
              className="rb-vtab-more"
              aria-expanded={isOpen}
              onClick={toggle}
            >
              {t`More`} <Icon name="caret" size={14} />
            </button>
          )}
        />
      )}
      <span className="rb-sp" />
      <button
        type="button"
        className="rb-vtab-add"
        aria-label={t`Add view`}
        title={t`Add view`}
        onClick={onCreate}
      >
        <Icon name="plus" size={14} strokeWidth={2} />
      </button>
      <Modal
        open={isDefined(renamingView)}
        title={t`Rename view`}
        onClose={() => setRenamingView(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenamingView(null)}>
              {t`Cancel`}
            </Button>
            <Button
              variant="primary"
              disabled={!isNonEmptyString(newName.trim())}
              onClick={async () => {
                if (isDefined(renamingView)) {
                  await performViewApiUpdate({
                    id: renamingView.id,
                    input: { name: newName.trim() },
                  });
                }
                setRenamingView(null);
              }}
            >
              {t`Rename`}
            </Button>
          </>
        }
      >
        <Input
          value={newName}
          aria-label={t`View name`}
          onChange={(event) => setNewName(event.target.value)}
        />
      </Modal>
      <Modal
        open={isDefined(deletingView)}
        tone="danger"
        title={t`Delete this view?`}
        subtitle={t`The view is removed for everyone who can see it. Records are not affected.`}
        onClose={() => setDeletingView(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingView(null)}>
              {t`Cancel`}
            </Button>
            <Button
              variant="primary"
              tone="danger"
              onClick={async () => {
                if (isDefined(deletingView)) {
                  const fallback = tableViews.find(
                    (candidate) => candidate.id !== deletingView.id,
                  );

                  await performViewApiDestroy({ id: deletingView.id });
                  if (isDefined(fallback)) {
                    onChange(fallback.id);
                  }
                }
                setDeletingView(null);
              }}
            >
              {t`Delete`}
            </Button>
          </>
        }
      />
    </div>
  );
};
