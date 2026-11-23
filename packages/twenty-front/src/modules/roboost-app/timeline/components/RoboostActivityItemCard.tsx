import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { roboostFieldHistoryState } from '@/roboost-app/history/states/roboostFieldHistoryState';
import { RoboostActivityExpandedBody } from '@/roboost-app/timeline/components/RoboostActivityExpandedBody';
import { ROBOOST_ACTIVITY_BODY_FIELD_BY_OBJECT } from '@/roboost-app/timeline/constants/RoboostActivityBodyFieldByObject';
import { useRoboostCanEditActivity } from '@/roboost-app/timeline/hooks/useRoboostCanEditActivity';
import { roboostPropertiesPanelState } from '@/roboost-app/timeline/states/roboostPropertiesPanelState';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu } from '@/roboost-ui/components/Menu';
import { Modal } from '@/roboost-ui/components/Modal';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { type RoboostTone } from '@/roboost-ui/types/RoboostTone';
import { cx } from '@/roboost-ui/utils/cx';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useState } from 'react';

type RoboostActivityItemCardProps = {
  objectNameSingular: string;
  recordId: string;
  icon: RoboostIconName;
  tone: RoboostTone;
  title: ReactNode;
  time: ReactNode;
  preview?: string;
  isExpanded: boolean;
  onToggleExpanded: (isExpanded: boolean) => void;
  isPinned: boolean;
  onTogglePin: () => void;
  onChanged: () => void;
};

// Notes, calls, messages, tasks and meetings open in place, like email cards
export const RoboostActivityItemCard = ({
  objectNameSingular,
  recordId,
  icon,
  tone,
  title,
  time,
  preview,
  isExpanded,
  onToggleExpanded,
  isPinned,
  onTogglePin,
  onChanged,
}: RoboostActivityItemCardProps) => {
  const { t } = useLingui();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const setRoboostFieldHistory = useSetAtomState(roboostFieldHistoryState);
  const setRoboostPropertiesPanel = useSetAtomState(
    roboostPropertiesPanelState,
  );
  const { canEditActivity } = useRoboostCanEditActivity();
  const { deleteOneRecord } = useDeleteOneRecord({ objectNameSingular });
  const canEdit = canEditActivity({ objectNameSingular, recordId });

  const toggle = () => onToggleExpanded(!isExpanded);

  return (
    <div
      className={cx(
        'rb-actc',
        isExpanded && 'is-open',
        isPinned && 'is-pinned',
      )}
    >
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
        <span className={cx('rb-actc-icon', `rb-tone-${tone}`)}>
          <Icon name={icon} size={14} />
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
          {isPinned && <Icon name="pin" size={12} className="rb-actc-pin" />}
          {title}
        </div>
        <Menu
          align="right"
          minWidth={210}
          entries={[
            {
              id: 'pin',
              label: isPinned ? t`Unpin` : t`Pin`,
              icon: 'pin',
              onSelect: onTogglePin,
            },
            {
              id: 'history',
              label: t`History`,
              icon: 'history',
              onSelect: () =>
                setRoboostFieldHistory({
                  objectNameSingular,
                  recordId,
                  fieldName:
                    ROBOOST_ACTIVITY_BODY_FIELD_BY_OBJECT[objectNameSingular] ??
                    'title',
                }),
            },
            {
              id: 'properties',
              label: t`View all properties`,
              icon: 'list',
              onSelect: () =>
                setRoboostPropertiesPanel({ objectNameSingular, recordId }),
            },
            { id: 'sep', isSeparator: true },
            {
              id: 'delete',
              label: t`Delete`,
              icon: 'trash',
              isDanger: true,
              isDisabled: !canEdit,
              onSelect: () => canEdit && setIsDeleteOpen(true),
            },
          ]}
          trigger={({ toggle: toggleMenu, isOpen }) => (
            <button
              type="button"
              className="rb-actc-actions"
              aria-expanded={isOpen}
              onClick={toggleMenu}
            >
              {t`Actions`}
              <Icon name="caret" size={12} />
            </button>
          )}
        />
        <span className="rb-actc-time">{time}</span>
      </div>
      {!isExpanded && preview !== undefined && preview.trim() !== '' && (
        <div className="rb-actc-preview" onClick={toggle}>
          {preview}
        </div>
      )}
      {isExpanded && (
        <RoboostActivityExpandedBody
          objectNameSingular={objectNameSingular}
          recordId={recordId}
          canEdit={canEdit}
          onSaved={onChanged}
        />
      )}
      <Modal
        open={isDeleteOpen}
        tone="danger"
        title={t`Delete this activity?`}
        subtitle={t`It moves to the trash and can be restored from there.`}
        onClose={() => setIsDeleteOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              {t`Cancel`}
            </Button>
            <Button
              variant="primary"
              tone="danger"
              onClick={async () => {
                await deleteOneRecord(recordId);
                setIsDeleteOpen(false);
                onChanged();
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
