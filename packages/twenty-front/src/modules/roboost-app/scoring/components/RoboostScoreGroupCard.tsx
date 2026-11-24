import { useRoboostScoreEditor } from '@/roboost-app/scoring/components/RoboostScoreEditorContext';
import { RoboostScoreRuleSetCard } from '@/roboost-app/scoring/components/RoboostScoreRuleSetCard';
import {
  addRoboostScoreRuleSet,
  cloneRoboostScoreGroup,
  deleteRoboostScoreGroup,
  moveRoboostScoreGroup,
  moveRoboostScoreRuleSet,
  updateRoboostScoreGroup,
} from '@/roboost-app/scoring/utils/roboostScoreCriteriaUpdates';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { Modal } from '@/roboost-ui/components/Modal';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined, type RoboostScoreGroup } from 'twenty-shared/utils';

type RoboostScoreGroupCardProps = {
  group: RoboostScoreGroup;
};

const formatNumber = (value: number) =>
  value.toLocaleString('en-US', { maximumFractionDigits: 1 });

export const RoboostScoreGroupCard = ({
  group,
}: RoboostScoreGroupCardProps) => {
  const { t } = useLingui();
  const {
    canEdit,
    validation,
    updateDraft,
    testResult,
    dragItem,
    setDragItem,
  } = useRoboostScoreEditor();
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [limitDraft, setLimitDraft] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const groupMax = validation.groupMaxById[group.id] ?? 0;
  const isOverLimit = validation.groupsOverLimit.includes(group.id);
  const result = testResult?.breakdown.groups.find(({ id }) => id === group.id);
  const ruleSetCount = group.ruleSets.length;
  const maxText = formatNumber(groupMax);
  const limitText = isDefined(group.limit) ? formatNumber(group.limit) : '';

  const update = (next: (current: RoboostScoreGroup) => RoboostScoreGroup) =>
    updateDraft((criteria) =>
      updateRoboostScoreGroup(criteria, group.id, next),
    );

  const commitName = () => {
    setIsRenaming(false);
    const name = nameDraft.trim();

    if (name !== '' && name !== group.name) {
      update((current) => ({ ...current, name }));
    } else {
      setNameDraft(group.name);
    }
  };

  const commitLimit = () => {
    if (limitDraft === null) {
      return;
    }
    const limit = Math.round(Math.abs(Number(limitDraft)) * 10) / 10;

    setLimitDraft(null);
    update((current) => ({
      ...current,
      limit:
        limitDraft.trim() !== '' && Number.isFinite(limit) && limit > 0
          ? limit
          : null,
    }));
  };

  const appliedText = isDefined(result) ? formatNumber(result.applied) : '';
  const rawText = isDefined(result) ? formatNumber(result.raw) : '';

  return (
    <section
      className={cx(
        'rb-scg',
        isOverLimit && 'is-invalid',
        isDropTarget && 'is-drop-target',
      )}
      onDragOver={(event) => {
        if (
          (dragItem?.type === 'group' && dragItem.groupId !== group.id) ||
          (dragItem?.type === 'ruleSet' && group.ruleSets.length === 0)
        ) {
          event.preventDefault();
          setIsDropTarget(true);
        }
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(event) => {
        setIsDropTarget(false);
        if (dragItem?.type === 'group') {
          event.preventDefault();
          updateDraft((criteria) =>
            moveRoboostScoreGroup(criteria, dragItem.groupId, group.id),
          );
          setDragItem(null);
        } else if (
          dragItem?.type === 'ruleSet' &&
          group.ruleSets.length === 0
        ) {
          event.preventDefault();
          updateDraft((criteria) =>
            moveRoboostScoreRuleSet(criteria, {
              fromGroupId: dragItem.groupId,
              ruleSetId: dragItem.ruleSetId,
              toGroupId: group.id,
              beforeRuleSetId: null,
            }),
          );
          setDragItem(null);
        }
      }}
    >
      <header className="rb-scg-head">
        {canEdit && (
          <span
            className="rb-sc-grip"
            draggable
            title={t`Drag to reorder`}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move';
              setDragItem({ type: 'group', groupId: group.id });
            }}
            onDragEnd={() => setDragItem(null)}
          >
            <Icon name="grip" size={14} />
          </span>
        )}
        <button
          type="button"
          className="rb-scg-caret"
          aria-expanded={!group.collapsed}
          aria-label={group.collapsed ? t`Expand group` : t`Collapse group`}
          onClick={() =>
            update((current) => ({ ...current, collapsed: !current.collapsed }))
          }
        >
          <Icon name={group.collapsed ? 'chevron-right' : 'caret'} size={16} />
        </button>
        {isRenaming ? (
          <Input
            size="sm"
            aria-label={t`Group name`}
            className="rb-scg-name-input"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={commitName}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commitName();
              }
              if (event.key === 'Escape') {
                setNameDraft(group.name);
                setIsRenaming(false);
              }
            }}
          />
        ) : (
          <h3 className="rb-scg-name">
            <span className="rb-truncate">{group.name}</span>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon="pencil"
                aria-label={t`Rename group`}
                onClick={() => {
                  setNameDraft(group.name);
                  setIsRenaming(true);
                }}
              />
            )}
          </h3>
        )}
        <span className="rb-scg-meta">
          {ruleSetCount === 1
            ? t`1 rule set · max ${maxText} pts`
            : t`${ruleSetCount} rule sets · max ${maxText} pts`}
        </span>
        {isDefined(result) && (
          <span className="rb-scg-applied">
            {result.raw !== result.applied
              ? t`${appliedText} points applied (raw ${rawText}, capped by limit ${limitText})`
              : t`${appliedText} points applied`}
          </span>
        )}
        <span className="rb-sp" />
        {limitDraft !== null ? (
          <span className="rb-scg-limit-edit">
            <Input
              type="number"
              size="sm"
              aria-label={t`Group limit`}
              value={limitDraft}
              onChange={(event) => setLimitDraft(event.target.value)}
              onBlur={commitLimit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commitLimit();
                }
                if (event.key === 'Escape') {
                  setLimitDraft(null);
                }
              }}
            />
            <span>{t`pts`}</span>
          </span>
        ) : isDefined(group.limit) ? (
          <span className={cx('rb-scg-limit', isOverLimit && 'is-invalid')}>
            {t`Limit: ${limitText} pts`}
            {canEdit && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon="pencil"
                  aria-label={t`Edit group limit`}
                  onClick={() => setLimitDraft(String(group.limit))}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon="x"
                  aria-label={t`Remove group limit`}
                  onClick={() =>
                    update((current) => ({ ...current, limit: null }))
                  }
                />
              </>
            )}
          </span>
        ) : (
          canEdit && (
            <Button
              variant="secondary"
              size="sm"
              icon="plus"
              onClick={() => setLimitDraft('')}
            >
              {t`Add group limit`}
            </Button>
          )
        )}
        {canEdit && (
          <Menu
            align="right"
            minWidth={180}
            entries={[
              {
                id: 'clone',
                label: t`Clone group`,
                icon: 'copy',
                onSelect: () =>
                  updateDraft((criteria) =>
                    cloneRoboostScoreGroup(
                      criteria,
                      group.id,
                      (name) => t`Copy of ${name}`,
                    ),
                  ),
              },
              {
                id: 'delete',
                label: t`Delete group`,
                icon: 'trash',
                isDanger: true,
                onSelect: () => setIsDeleteOpen(true),
              },
            ]}
            trigger={({ toggle, isOpen }) => (
              <Button
                variant="secondary"
                size="sm"
                iconOnly
                icon="more-vertical"
                aria-label={t`Group actions`}
                aria-expanded={isOpen}
                onClick={toggle}
              />
            )}
          />
        )}
      </header>
      {isOverLimit && (
        <div className="rb-sc-inline-warning">
          <Icon name="alert-triangle" size={13} />
          {t`This group can reach ${maxText} points, more than its limit of ${limitText}. Lower the points or raise the limit.`}
        </div>
      )}
      {!group.collapsed && (
        <div className="rb-scg-body">
          {group.ruleSets.map((ruleSet) => (
            <RoboostScoreRuleSetCard
              key={ruleSet.id}
              groupId={group.id}
              ruleSet={ruleSet}
              isGroupOverLimit={isOverLimit}
            />
          ))}
          {canEdit && (
            <button
              type="button"
              className="rb-sc-addlink"
              onClick={() =>
                updateDraft((criteria) =>
                  addRoboostScoreRuleSet(criteria, group.id),
                )
              }
            >
              <Icon name="plus" size={13} />
              {t`Add property criteria`}
            </button>
          )}
        </div>
      )}
      {isDeleteOpen && (
        <Modal
          tone="danger"
          title={t`Delete this group?`}
          subtitle={t`Its rule sets and their conditions are deleted too.`}
          width={440}
          onClose={() => setIsDeleteOpen(false)}
          footer={
            <>
              <span className="rb-sp" />
              <Button
                variant="secondary"
                onClick={() => setIsDeleteOpen(false)}
              >
                {t`Cancel`}
              </Button>
              <Button
                variant="primary"
                tone="danger"
                onClick={() => {
                  setIsDeleteOpen(false);
                  updateDraft((criteria) =>
                    deleteRoboostScoreGroup(criteria, group.id),
                  );
                }}
              >
                {t`Delete group`}
              </Button>
            </>
          }
        />
      )}
    </section>
  );
};
