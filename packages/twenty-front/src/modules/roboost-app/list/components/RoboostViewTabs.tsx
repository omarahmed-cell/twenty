import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { Modal } from '@/roboost-ui/components/Modal';
import { cx } from '@/roboost-ui/utils/cx';
import { usePerformViewApiPersist } from '@/views/hooks/internal/usePerformViewApiPersist';
import { usePerformViewFieldApiPersist } from '@/views/hooks/internal/usePerformViewFieldApiPersist';
import { type View } from '@/views/types/View';
import { resolveViewNamePlaceholders } from '@/views/utils/resolveViewNamePlaceholders';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { v4 } from 'uuid';
import { ViewType } from '~/generated-metadata/graphql';

const VISIBLE_TAB_COUNT = 4;

const formatCount = (count: number) =>
  count >= 1000
    ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`
    : String(count);

type RoboostViewTabsProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  views: View[];
  activeViewId: string | undefined;
  activeCount: number | undefined;
  onChange: (viewId: string) => void;
};

export const RoboostViewTabs = ({
  objectMetadataItem,
  views,
  activeViewId,
  activeCount,
  onChange,
}: RoboostViewTabsProps) => {
  const { t } = useLingui();
  const { performViewApiCreate } = usePerformViewApiPersist();
  const { performViewFieldApiCreate } = usePerformViewFieldApiPersist();
  const [isCreating, setIsCreating] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const tableViews = views.filter((view) => view.type !== ViewType.KANBAN);
  const activeIndex = tableViews.findIndex((view) => view.id === activeViewId);
  const visibleViews =
    activeIndex >= VISIBLE_TAB_COUNT
      ? [...tableViews.slice(0, VISIBLE_TAB_COUNT - 1), tableViews[activeIndex]]
      : tableViews.slice(0, VISIBLE_TAB_COUNT);
  const overflowViews = tableViews.filter(
    (view) => !visibleViews.includes(view),
  );
  const activeView = tableViews[activeIndex];

  const createView = async () => {
    setIsSaving(true);

    try {
      const viewId = v4();

      await performViewApiCreate(
        {
          input: {
            id: viewId,
            name: newViewName.trim(),
            objectMetadataId: objectMetadataItem.id,
            icon: 'IconList',
            type: ViewType.TABLE,
          },
        },
        objectMetadataItem.id,
      );
      // A new view starts with the current view's columns
      const inputs = (activeView?.viewFields ?? [])
        .filter((viewField) => viewField.isVisible)
        .map((viewField) => ({
          fieldMetadataId: viewField.fieldMetadataId,
          viewId,
          isVisible: true,
          position: viewField.position,
          size: viewField.size,
        }));

      await performViewFieldApiCreate({ inputs });
      setIsCreating(false);
      setNewViewName('');
      onChange(viewId);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rb-ls-tabs">
      {visibleViews.map((view) => (
        <button
          key={view.id}
          type="button"
          className={cx('rb-vtab', view.id === activeViewId && 'is-on')}
          aria-pressed={view.id === activeViewId}
          onClick={() => onChange(view.id)}
        >
          {resolveViewNamePlaceholders(view.name, objectMetadataItem)}
          {view.id === activeViewId && activeCount !== undefined && (
            <span className="rb-vc">{formatCount(activeCount)}</span>
          )}
        </button>
      ))}
      {overflowViews.length > 0 && (
        <Menu
          entries={overflowViews.map((view) => ({
            id: view.id,
            label: resolveViewNamePlaceholders(view.name, objectMetadataItem),
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
        onClick={() => setIsCreating(true)}
      >
        <Icon name="plus" size={14} strokeWidth={2} />
      </button>
      <Modal
        open={isCreating}
        title={t`Create view`}
        subtitle={t`It starts with the columns of the current view.`}
        onClose={() => setIsCreating(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreating(false)}>
              {t`Cancel`}
            </Button>
            <Button
              variant="primary"
              disabled={!isNonEmptyString(newViewName.trim()) || isSaving}
              onClick={createView}
            >
              {t`Create view`}
            </Button>
          </>
        }
      >
        <Input
          value={newViewName}
          placeholder={t`View name`}
          aria-label={t`View name`}
          onChange={(event) => setNewViewName(event.target.value)}
        />
      </Modal>
    </div>
  );
};
