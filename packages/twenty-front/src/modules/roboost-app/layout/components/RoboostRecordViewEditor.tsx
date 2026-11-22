import { buildConditionalLogicFields } from '@/conditional-logic/utils/buildConditionalLogicFields';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { RoboostCardFieldsModal } from '@/roboost-app/layout/components/RoboostCardFieldsModal';
import { RoboostCardLogicPopover } from '@/roboost-app/layout/components/RoboostCardLogicPopover';
import {
  type RoboostLayoutDragProps,
  RoboostLayoutAddCardButton,
  RoboostLayoutEditorCard,
} from '@/roboost-app/layout/components/RoboostLayoutEditorCard';
import { useRoboostRecordLayoutConfig } from '@/roboost-app/layout/hooks/useRoboostRecordLayoutConfig';
import {
  type RoboostCardLogic,
  type RoboostRecordLayoutConfig,
} from '@/roboost-app/layout/types/RoboostRecordLayout';
import { getRoboostRecordViewSettingsPath } from '@/roboost-app/layout/utils/getRoboostLayoutSettingsPath';
import { moveRoboostLayoutItem } from '@/roboost-app/layout/utils/moveRoboostLayoutItem';
import { getRoboostDefaultAssociationFieldNames } from '@/roboost-app/layout/utils/resolveRoboostRecordLayout';
import { hasRoboostCardLogic } from '@/roboost-app/layout/utils/roboostCardLogic';
import { getRoboostLabelIdentifierFieldName } from '@/roboost-app/fields/getRoboostRecordLabel';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { type MenuEntry } from '@/roboost-ui/components/Menu';
import { Modal } from '@/roboost-ui/components/Modal';
import { Tabs } from '@/roboost-ui/components/Tabs';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

type RoboostLayoutHistory = {
  past: RoboostRecordLayoutConfig[];
  present: RoboostRecordLayoutConfig;
  future: RoboostRecordLayoutConfig[];
};

type RoboostLayoutPanel = 'left' | 'right' | 'overview';

type RoboostLayoutModalState =
  | { kind: 'add-card'; index: number }
  | { kind: 'edit-card'; cardId: string }
  | { kind: 'edit-association'; cardId: string }
  | { kind: 'rename-section'; sectionId: string }
  | { kind: 'logic'; panel: 'left' | 'right'; cardId: string; anchor: DOMRect }
  | { kind: 'confirm-exit' };

type RoboostRecordViewEditorProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
};

const QUICK_ACTION_PLACEHOLDER_COUNT = 6;

const summarizeFieldNames = (
  fieldNames: string[],
  fields: FieldMetadataItem[],
) =>
  fieldNames
    .map((name) => fields.find((field) => field.name === name)?.label)
    .filter(isDefined)
    .join(', ');

// Full-screen editor of one object's record page; nothing is written until Save
export const RoboostRecordViewEditor = ({
  objectMetadataItem,
  objectMetadataItems,
}: RoboostRecordViewEditorProps) => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const config = useRoboostRecordLayoutConfig(
    objectMetadataItem,
    objectMetadataItems,
  );
  const [history, setHistory] = useState<RoboostLayoutHistory | null>(null);
  const [middleTab, setMiddleTab] = useState<'overview' | 'activities'>(
    'overview',
  );
  const [modal, setModal] = useState<RoboostLayoutModalState | null>(null);
  const [dragged, setDragged] = useState<{
    panel: RoboostLayoutPanel;
    id: string;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );

  const layout = history?.present ?? config.layout;
  const isDirty =
    isDefined(history) &&
    JSON.stringify(history.present) !== JSON.stringify(config.layout);

  const activeFields = objectMetadataItem.fields.filter(
    (field) => field.isActive && !field.isSystem,
  );
  const labelFieldName = getRoboostLabelIdentifierFieldName(objectMetadataItem);
  const pickableFields = activeFields.filter(
    (field) => field.name !== labelFieldName,
  );
  const logicFields = buildConditionalLogicFields(activeFields);
  const associationById = new Map(
    config.associations.map((association) => [association.id, association]),
  );

  const commit = (next: RoboostRecordLayoutConfig) => {
    setHistory({
      past: [...(history?.past ?? []), layout],
      present: next,
      future: [],
    });
    setStatus('idle');
  };

  const undo = () => {
    if (!isDefined(history) || history.past.length === 0) {
      return;
    }
    setHistory({
      past: history.past.slice(0, -1),
      present: history.past[history.past.length - 1],
      future: [history.present, ...history.future],
    });
  };

  const redo = () => {
    if (!isDefined(history) || history.future.length === 0) {
      return;
    }
    setHistory({
      past: [...history.past, history.present],
      present: history.future[0],
      future: history.future.slice(1),
    });
  };

  const exit = () => {
    setModal(null);
    navigate(getRoboostRecordViewSettingsPath());
  };

  const save = async (thenExit: boolean) => {
    setStatus('saving');
    try {
      await config.save(layout);
      setStatus('saved');
      if (thenExit) {
        exit();
      }
    } catch {
      setStatus('error');
    }
  };

  const dragProps = (
    panel: RoboostLayoutPanel,
    id: string,
    onMove: (draggedId: string) => void,
  ): RoboostLayoutDragProps => ({
    isDragging: dragged?.panel === panel && dragged.id === id,
    isDropTarget: dropTarget === `${panel}:${id}` && dragged?.id !== id,
    onDragStart: () => setDragged({ panel, id }),
    onDragOver: () => {
      if (dragged?.panel === panel) {
        setDropTarget(`${panel}:${id}`);
      }
    },
    onDrop: () => {
      if (dragged?.panel === panel && dragged.id !== id) {
        onMove(dragged.id);
      }
      setDragged(null);
      setDropTarget(null);
    },
    onDragEnd: () => {
      setDragged(null);
      setDropTarget(null);
    },
  });

  const setCardLogic = (
    panel: 'left' | 'right',
    cardId: string,
    logic: RoboostCardLogic | undefined,
  ) =>
    commit(
      panel === 'left'
        ? {
            ...layout,
            left: layout.left.map((card) =>
              card.id === cardId ? { ...card, logic } : card,
            ),
          }
        : {
            ...layout,
            right: layout.right.map((card) =>
              card.id === cardId ? { ...card, logic } : card,
            ),
          },
    );

  const logicEntry = (
    panel: 'left' | 'right',
    cardId: string,
    getAnchor: () => DOMRect,
  ): MenuEntry => ({
    id: 'logic',
    label: t`Set conditional logic`,
    icon: 'git-branch',
    onSelect: () =>
      setModal({ kind: 'logic', panel, cardId, anchor: getAnchor() }),
  });

  const removedAssociations = layout.removedRightIds
    .map((id) => associationById.get(id))
    .filter(isDefined);
  const addAssociationEntries = (index: number): MenuEntry[] =>
    removedAssociations.length === 0
      ? [
          {
            id: 'none',
            label: t`Every association is already on the panel`,
            isDisabled: true,
            onSelect: () => {},
          },
        ]
      : [
          { id: 'heading', heading: t`Add association card` },
          ...removedAssociations.map((association) => ({
            id: association.id,
            label: association.title,
            icon: 'link' as const,
            onSelect: () => {
              const right = [...layout.right];

              right.splice(index, 0, {
                id: association.id,
                isHidden: false,
                fieldNames: getRoboostDefaultAssociationFieldNames(association),
              });
              commit({
                ...layout,
                right,
                removedRightIds: layout.removedRightIds.filter(
                  (id) => id !== association.id,
                ),
              });
            },
          })),
        ];

  const renderModal = () => {
    if (!isDefined(modal)) {
      return null;
    }
    const close = () => setModal(null);

    switch (modal.kind) {
      case 'add-card':
        return (
          <RoboostCardFieldsModal
            heading={t`Add card`}
            submitLabel={t`Create`}
            initialName=""
            fields={pickableFields}
            onClose={close}
            onApply={({ name, fieldNames }) => {
              const left = [...layout.left];

              left.splice(modal.index, 0, {
                id: v4(),
                title: name,
                fieldNames,
              });
              commit({ ...layout, left });
              close();
            }}
          />
        );
      case 'edit-card': {
        const card = layout.left.find(({ id }) => id === modal.cardId);

        return isDefined(card) ? (
          <RoboostCardFieldsModal
            heading={t`Edit card`}
            submitLabel={t`Apply`}
            initialName={card.title}
            fields={pickableFields}
            initialFieldNames={card.fieldNames}
            onClose={close}
            onApply={({ name, fieldNames }) => {
              commit({
                ...layout,
                left: layout.left.map((candidate) =>
                  candidate.id === card.id
                    ? { ...candidate, title: name, fieldNames }
                    : candidate,
                ),
              });
              close();
            }}
          />
        ) : null;
      }
      case 'edit-association': {
        const card = layout.right.find(({ id }) => id === modal.cardId);
        const association = associationById.get(modal.cardId);

        if (
          !isDefined(card) ||
          !isDefined(association) ||
          association.kind === 'attachments'
        ) {
          return null;
        }
        const target = association.targetObjectMetadataItem;
        const targetLabelField = getRoboostLabelIdentifierFieldName(target);

        return (
          <RoboostCardFieldsModal
            heading={t`${association.title} card`}
            submitLabel={t`Apply`}
            fields={target.fields.filter(
              (field) =>
                field.isActive &&
                !field.isSystem &&
                field.name !== targetLabelField,
            )}
            initialFieldNames={card.fieldNames}
            fieldsHint={t`Each ${target.labelSingular.toLowerCase()} card shows its name, then these properties. The first dropdown property shows as a tag.`}
            onClose={close}
            onApply={({ fieldNames }) => {
              commit({
                ...layout,
                right: layout.right.map((candidate) =>
                  candidate.id === card.id
                    ? { ...candidate, fieldNames }
                    : candidate,
                ),
              });
              close();
            }}
          />
        );
      }
      case 'rename-section': {
        const section = layout.overview.find(
          ({ id }) => id === modal.sectionId,
        );

        return isDefined(section) ? (
          <RoboostCardFieldsModal
            heading={t`Rename section`}
            submitLabel={t`Apply`}
            initialName={section.title}
            onClose={close}
            onApply={({ name }) => {
              commit({
                ...layout,
                overview: layout.overview.map((candidate) =>
                  candidate.id === section.id
                    ? { ...candidate, title: name }
                    : candidate,
                ),
              });
              close();
            }}
          />
        ) : null;
      }
      case 'logic': {
        const card =
          modal.panel === 'left'
            ? layout.left.find(({ id }) => id === modal.cardId)
            : layout.right.find(({ id }) => id === modal.cardId);
        const title =
          modal.panel === 'left'
            ? (layout.left.find(({ id }) => id === modal.cardId)?.title ?? '')
            : (associationById.get(modal.cardId)?.title ?? '');

        return isDefined(card) ? (
          <RoboostCardLogicPopover
            cardTitle={title}
            anchor={modal.anchor}
            logic={card.logic}
            fields={logicFields}
            onClose={close}
            onApply={(logic) => {
              setCardLogic(modal.panel, card.id, logic);
              close();
            }}
          />
        ) : null;
      }
      case 'confirm-exit':
        return (
          <Modal
            title={t`Leave without saving?`}
            subtitle={t`Your changes to this record view will be lost.`}
            tone="danger"
            width={440}
            onClose={close}
            footer={
              <>
                <Button variant="ghost" onClick={close}>
                  {t`Keep editing`}
                </Button>
                <Button variant="primary" tone="danger" onClick={exit}>
                  {t`Discard changes`}
                </Button>
              </>
            }
          />
        );
    }
  };

  const left = (
    <div className="rb-rve-col rb-rve-left" aria-label={t`Left panel cards`}>
      <div
        className="rb-rve-identity"
        title={t`Always shown; not editable here`}
      >
        <div className="rb-rve-identity-top">
          <Avatar name={objectMetadataItem.labelSingular} size="lg" />
          <div className="rb-rve-identity-name">
            {t`${objectMetadataItem.labelSingular} name`}
          </div>
          <span className="rb-sp" />
          <Icon name="pin" size={14} />
        </div>
        <div className="rb-rve-identity-actions">
          {Array.from({ length: QUICK_ACTION_PLACEHOLDER_COUNT }).map(
            (_, index) => (
              <span key={index} className="rb-rve-identity-dot" />
            ),
          )}
        </div>
      </div>
      <RoboostLayoutAddCardButton
        label={t`Add card`}
        onClick={() => setModal({ kind: 'add-card', index: 0 })}
      />
      {layout.left.map((card, index) => (
        <div key={card.id} className="rb-rve-slot">
          <RoboostLayoutEditorCard
            title={card.title}
            subtitle={
              card.fieldNames.length > 0
                ? summarizeFieldNames(
                    card.fieldNames,
                    objectMetadataItem.fields,
                  )
                : t`No properties yet`
            }
            hasLogic={hasRoboostCardLogic(card.logic)}
            onEdit={() => setModal({ kind: 'edit-card', cardId: card.id })}
            menuEntries={(getAnchor) => [
              logicEntry('left', card.id, getAnchor),
              {
                id: 'remove',
                label: t`Remove card`,
                icon: 'trash',
                isDanger: true,
                onSelect: () =>
                  commit({
                    ...layout,
                    left: layout.left.filter(({ id }) => id !== card.id),
                  }),
              },
            ]}
            drag={dragProps('left', card.id, (draggedId) =>
              commit({
                ...layout,
                left: moveRoboostLayoutItem(
                  layout.left,
                  ({ id }) => id,
                  draggedId,
                  card.id,
                ),
              }),
            )}
          />
          <RoboostLayoutAddCardButton
            label={t`Add card`}
            onClick={() => setModal({ kind: 'add-card', index: index + 1 })}
          />
        </div>
      ))}
    </div>
  );

  const middle = (
    <div className="rb-rve-col rb-rve-middle">
      <Tabs
        className="rb-rve-tabs"
        tabs={[
          { id: 'overview', label: t`Overview` },
          { id: 'activities', label: t`Activities` },
        ]}
        value={middleTab}
        onChange={(id) =>
          setMiddleTab(id === 'activities' ? 'activities' : 'overview')
        }
      />
      {middleTab === 'overview' ? (
        <div className="rb-rve-sections">
          {layout.overview.map((section) => (
            <RoboostLayoutEditorCard
              key={section.id}
              title={section.title}
              subtitle={
                section.id === 'openTasks'
                  ? t`Tasks that are not done yet`
                  : section.id === 'pinnedActivities'
                    ? t`Activities pinned to the record`
                    : t`The most recent activities`
              }
              isHidden={section.isHidden}
              onToggleHidden={() =>
                commit({
                  ...layout,
                  overview: layout.overview.map((candidate) =>
                    candidate.id === section.id
                      ? { ...candidate, isHidden: !candidate.isHidden }
                      : candidate,
                  ),
                })
              }
              onEdit={() =>
                setModal({ kind: 'rename-section', sectionId: section.id })
              }
              drag={dragProps('overview', section.id, (draggedId) =>
                commit({
                  ...layout,
                  overview: moveRoboostLayoutItem(
                    layout.overview,
                    ({ id }) => id,
                    draggedId,
                    section.id,
                  ),
                }),
              )}
            />
          ))}
        </div>
      ) : (
        <div className="rb-rve-timeline">
          <Icon name="history" size={18} />
          {t`Activity timeline`}
        </div>
      )}
    </div>
  );

  const right = (
    <div className="rb-rve-col rb-rve-right" aria-label={t`Association cards`}>
      <RoboostLayoutAddCardButton
        label={t`Add card`}
        menuEntries={addAssociationEntries(0)}
      />
      {layout.right.map((card, index) => {
        const association = associationById.get(card.id);

        if (!isDefined(association)) {
          return null;
        }
        const relatedFields =
          association.kind === 'attachments'
            ? []
            : association.targetObjectMetadataItem.fields;

        return (
          <div key={card.id} className="rb-rve-slot">
            <RoboostLayoutEditorCard
              title={association.title}
              subtitle={
                association.kind === 'attachments'
                  ? t`Files attached to the record`
                  : card.fieldNames.length > 0
                    ? summarizeFieldNames(card.fieldNames, relatedFields)
                    : t`Name only`
              }
              isHidden={card.isHidden}
              hasLogic={hasRoboostCardLogic(card.logic)}
              onToggleHidden={() =>
                commit({
                  ...layout,
                  right: layout.right.map((candidate) =>
                    candidate.id === card.id
                      ? { ...candidate, isHidden: !candidate.isHidden }
                      : candidate,
                  ),
                })
              }
              onEdit={
                association.kind === 'attachments'
                  ? undefined
                  : () =>
                      setModal({ kind: 'edit-association', cardId: card.id })
              }
              menuEntries={(getAnchor) => [
                logicEntry('right', card.id, getAnchor),
                {
                  id: 'remove',
                  label: t`Remove card`,
                  icon: 'trash',
                  isDanger: true,
                  onSelect: () =>
                    commit({
                      ...layout,
                      right: layout.right.filter(({ id }) => id !== card.id),
                      removedRightIds: [...layout.removedRightIds, card.id],
                    }),
                },
              ]}
              drag={dragProps('right', card.id, (draggedId) =>
                commit({
                  ...layout,
                  right: moveRoboostLayoutItem(
                    layout.right,
                    ({ id }) => id,
                    draggedId,
                    card.id,
                  ),
                }),
              )}
            />
            <RoboostLayoutAddCardButton
              label={t`Add card`}
              menuEntries={addAssociationEntries(index + 1)}
            />
          </div>
        );
      })}
    </div>
  );

  return createPortal(
    <div
      className="rb-ui rb-rve"
      role="dialog"
      aria-label={t`Record view editor`}
    >
      <header className="rb-rve-bar">
        <Button
          variant="secondary"
          size="sm"
          className="rb-rve-bar-btn"
          onClick={() =>
            isDirty ? setModal({ kind: 'confirm-exit' }) : exit()
          }
        >
          {t`Exit`}
        </Button>
        <button
          type="button"
          className="rb-rve-bar-icon"
          aria-label={t`Undo`}
          title={t`Undo`}
          disabled={!isDefined(history) || history.past.length === 0}
          onClick={undo}
        >
          <Icon name="reply" size={16} />
        </button>
        <button
          type="button"
          className="rb-rve-bar-icon"
          aria-label={t`Redo`}
          title={t`Redo`}
          disabled={!isDefined(history) || history.future.length === 0}
          onClick={redo}
        >
          <Icon name="forward" size={16} />
        </button>
        <div className="rb-rve-bar-title">
          {t`${objectMetadataItem.labelSingular} record page`}
          <span className="rb-rve-bar-sep">|</span>
          <span className="rb-rve-bar-view">{t`Default view`}</span>
        </div>
        {status === 'saved' && !isDirty && (
          <span className="rb-rve-bar-status">{t`Saved`}</span>
        )}
        {status === 'error' && (
          <span className="rb-rve-bar-status is-error">
            {t`Only workspace admins can change layouts.`}
          </span>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="rb-rve-bar-btn"
          disabled={!isDirty || status === 'saving'}
          onClick={() => save(false)}
        >
          {status === 'saving' ? t`Saving…` : t`Save`}
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="rb-rve-bar-save"
          disabled={status === 'saving'}
          onClick={() => (isDirty ? save(true) : exit())}
        >
          {t`Save and exit`}
        </Button>
      </header>
      <div className="rb-rve-body">
        {left}
        {middle}
        {right}
      </div>
      {renderModal()}
    </div>,
    document.body,
  );
};
