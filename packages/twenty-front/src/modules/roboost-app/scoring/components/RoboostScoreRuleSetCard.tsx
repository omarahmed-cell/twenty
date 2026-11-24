import { ROBOOST_FILTER_OPERATOR_LABELS } from '@/roboost-app/filters/constants/RoboostFilterOperatorLabels';
import { RoboostScoreConditionRow } from '@/roboost-app/scoring/components/RoboostScoreConditionRow';
import { useRoboostScoreEditor } from '@/roboost-app/scoring/components/RoboostScoreEditorContext';
import {
  deleteRoboostScoreRuleSet,
  duplicateRoboostScoreRuleSet,
  moveRoboostScoreRuleSet,
  syncRoboostScoreValuePoints,
  updateRoboostScoreRuleSet,
} from '@/roboost-app/scoring/utils/roboostScoreCriteriaUpdates';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { Modal } from '@/roboost-ui/components/Modal';
import { Select } from '@/roboost-ui/components/Select';
import { Toggle } from '@/roboost-ui/components/Toggle';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import {
  createRoboostScoreId,
  getRoboostFilterFieldKind,
  isDefined,
  isRoboostScoreConditionComplete,
  type RoboostScoreAction,
  type RoboostScoreCondition,
  type RoboostScoreRuleSet,
} from 'twenty-shared/utils';

type RoboostScoreRuleSetCardProps = {
  groupId: string;
  ruleSet: RoboostScoreRuleSet;
  isGroupOverLimit: boolean;
};

const formatPoints = (points: number) =>
  `${points > 0 ? '+' : points < 0 ? '−' : ''}${Math.abs(points).toLocaleString('en-US', { maximumFractionDigits: 1 })}`;

const parsePoints = (text: string) => {
  if (text.trim() === '') {
    return null;
  }
  const number = Number(text);

  return Number.isFinite(number)
    ? Math.round(Math.abs(number) * 10) / 10
    : null;
};

export const RoboostScoreRuleSetCard = ({
  groupId,
  ruleSet,
  isGroupOverLimit,
}: RoboostScoreRuleSetCardProps) => {
  const { t, i18n } = useLingui();
  const {
    fieldsByName,
    canEdit,
    validation,
    updateDraft,
    testResult,
    memberLabels,
    dragItem,
    setDragItem,
  } = useRoboostScoreEditor();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const completeConditions = ruleSet.conditions.filter(
    isRoboostScoreConditionComplete,
  );
  const hasCompleteCondition = completeConditions.length > 0;
  const allComplete =
    ruleSet.conditions.length > 0 &&
    completeConditions.length === ruleSet.conditions.length;
  const firstCondition = ruleSet.conditions[0];
  const firstField = isDefined(firstCondition?.fieldName)
    ? fieldsByName.get(firstCondition.fieldName)
    : undefined;
  const firstKind = isDefined(firstField)
    ? getRoboostFilterFieldKind(firstField)
    : null;
  const canUsePerValue =
    ruleSet.conditions.length === 1 &&
    isDefined(firstCondition) &&
    isRoboostScoreConditionComplete(firstCondition) &&
    ((firstKind === 'boolean' &&
      firstCondition.operand !== 'isKnown' &&
      firstCondition.operand !== 'isUnknown') ||
      (['select', 'multiSelect', 'relation'].includes(firstKind ?? '') &&
        firstCondition.operand === 'isAnyOf'));
  const isPerValue = ruleSet.mode === 'perValue';
  const perValueValues =
    firstKind === 'boolean' ? ['true', 'false'] : (firstCondition?.value ?? []);
  const result = testResult?.breakdown.groups
    .flatMap((group) => group.ruleSets)
    .find(({ id }) => id === ruleSet.id);
  const isInvalidPoints = validation.invalidPointsRuleSetIds.includes(
    ruleSet.id,
  );

  const update = (
    next: (current: RoboostScoreRuleSet) => RoboostScoreRuleSet,
  ) =>
    updateDraft((criteria) =>
      updateRoboostScoreRuleSet(criteria, groupId, ruleSet.id, next),
    );

  const updateConditions = (conditions: RoboostScoreCondition[]) =>
    update((current) => {
      const next = { ...current, conditions };
      const stillPerValue =
        current.mode === 'perValue' &&
        conditions.length === 1 &&
        conditions[0]?.fieldName === current.conditions[0]?.fieldName;

      if (!stillPerValue) {
        return { ...next, mode: 'fixed', valuePoints: [] };
      }
      const field = fieldsByName.get(conditions[0]?.fieldName ?? '');

      return syncRoboostScoreValuePoints(
        next,
        isDefined(field) && getRoboostFilterFieldKind(field) === 'boolean'
          ? ['true', 'false']
          : (conditions[0]?.value ?? []),
      );
    });

  const valueLabel = (value: string) => {
    if (firstKind === 'boolean') {
      return value === 'true' ? t`Yes` : t`No`;
    }
    if (firstKind === 'relation') {
      return firstCondition?.labels?.[value] ?? memberLabels[value] ?? value;
    }

    return (
      firstField?.options?.find((option) => option.value === value)?.label ??
      value
    );
  };

  const actionOptions = [
    { value: 'add', label: t`Add` },
    { value: 'subtract', label: t`Subtract` },
  ];

  const pointsEditor = ({
    action,
    points,
    onAction,
    onPoints,
    label,
  }: {
    action: RoboostScoreAction;
    points: number | null;
    onAction: (action: RoboostScoreAction) => void;
    onPoints: (points: number | null) => void;
    label: string;
  }) => {
    const isOver = isGroupOverLimit && action === 'add' && (points ?? 0) > 0;
    const isBad = points === null || isOver;

    return (
      <span className={cx('rb-scr-points', !canEdit && 'is-readonly')}>
        <Select
          aria-label={t`Add or subtract`}
          className="rb-scr-action"
          value={action}
          options={actionOptions}
          onChange={(value) => onAction(value as RoboostScoreAction)}
        />
        <Input
          type="number"
          size="sm"
          aria-label={label}
          className="rb-scr-points-input"
          invalid={isBad}
          value={points === null ? '' : String(points)}
          onChange={(event) => onPoints(parsePoints(event.target.value))}
        />
        <span>{t`points`}</span>
      </span>
    );
  };

  const summary = () => {
    const parts = ruleSet.conditions.map((condition) => {
      const field = fieldsByName.get(condition.fieldName ?? '');
      const operatorLabel = isDefined(condition.operand)
        ? i18n._(ROBOOST_FILTER_OPERATOR_LABELS[condition.operand])
        : '';
      const values = (condition.value ?? [])
        .map(
          (value) =>
            condition.labels?.[value] ??
            field?.options?.find((option) => option.value === value)?.label ??
            value,
        )
        .join(', ');

      return `${field?.label ?? t`Property`} ${operatorLabel} ${values}`.trim();
    });
    const pointsText = isPerValue
      ? t`Points per value`
      : `${formatPoints(ruleSet.action === 'subtract' ? -(ruleSet.points ?? 0) : (ruleSet.points ?? 0))} ${t`points`}`;

    return `${parts.join(` ${t`and`} `)} → ${pointsText}`;
  };

  return (
    <div
      className={cx(
        'rb-scr',
        isDefined(result) && (result.matched ? 'is-true' : 'is-false'),
        isDropTarget && 'is-drop-target',
      )}
      onDragOver={(event) => {
        if (dragItem?.type === 'ruleSet' && dragItem.ruleSetId !== ruleSet.id) {
          event.preventDefault();
          setIsDropTarget(true);
        }
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDropTarget(false);
        if (dragItem?.type === 'ruleSet') {
          updateDraft((criteria) =>
            moveRoboostScoreRuleSet(criteria, {
              fromGroupId: dragItem.groupId,
              ruleSetId: dragItem.ruleSetId,
              toGroupId: groupId,
              beforeRuleSetId: ruleSet.id,
            }),
          );
        }
        setDragItem(null);
      }}
    >
      <div className="rb-scr-head">
        {canEdit && (
          <span
            className="rb-sc-grip"
            draggable
            title={t`Drag to reorder`}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move';
              setDragItem({ type: 'ruleSet', groupId, ruleSetId: ruleSet.id });
            }}
            onDragEnd={() => setDragItem(null)}
          >
            <Icon name="grip" size={14} />
          </span>
        )}
        {isDefined(result) && (
          <span
            className={cx(
              'rb-scr-badge',
              result.matched ? 'is-true' : 'is-false',
            )}
          >
            <Icon
              name={result.matched ? 'check' : 'x'}
              size={13}
              strokeWidth={2.2}
            />
            {result.points === 0
              ? t`0 points`
              : `${formatPoints(result.points)} ${t`points`}`}
          </span>
        )}
        {ruleSet.collapsed === true && (
          <span className="rb-scr-summary rb-truncate">{summary()}</span>
        )}
        <span className="rb-sp" />
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          icon={ruleSet.collapsed === true ? 'maximize' : 'minimize'}
          aria-label={
            ruleSet.collapsed === true
              ? t`Expand rule set`
              : t`Collapse rule set`
          }
          onClick={() =>
            update((current) => ({ ...current, collapsed: !current.collapsed }))
          }
        />
        {canEdit && (
          <Menu
            align="right"
            minWidth={180}
            entries={[
              {
                id: 'duplicate',
                label: t`Duplicate`,
                icon: 'copy',
                onSelect: () =>
                  updateDraft((criteria) =>
                    duplicateRoboostScoreRuleSet(criteria, groupId, ruleSet.id),
                  ),
              },
              {
                id: 'delete',
                label: t`Delete rule set`,
                icon: 'trash',
                isDanger: true,
                onSelect: () => setIsDeleteOpen(true),
              },
            ]}
            trigger={({ toggle, isOpen }) => (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon="more-vertical"
                aria-label={t`Rule set actions`}
                aria-expanded={isOpen}
                onClick={toggle}
              />
            )}
          />
        )}
      </div>
      {ruleSet.collapsed !== true && (
        <>
          <div className="rb-scr-conds">
            {ruleSet.conditions.map((condition, index) => (
              <RoboostScoreConditionRow
                key={condition.id}
                condition={condition}
                isFirst={index === 0}
                onChange={(next) =>
                  updateConditions(
                    ruleSet.conditions.map((item) =>
                      item.id === condition.id ? next : item,
                    ),
                  )
                }
                onRemove={() =>
                  updateConditions(
                    ruleSet.conditions.filter(
                      (item) => item.id !== condition.id,
                    ),
                  )
                }
              />
            ))}
            {canEdit && (allComplete || ruleSet.conditions.length === 0) && (
              <div className="rb-scr-cond">
                <span className="rb-scr-and">
                  {ruleSet.conditions.length === 0 ? '' : t`and`}
                </span>
                <button
                  type="button"
                  className="rb-sc-addlink"
                  onClick={() =>
                    updateConditions([
                      ...ruleSet.conditions,
                      {
                        id: createRoboostScoreId(),
                        fieldName: null,
                        operand: null,
                        value: null,
                      },
                    ])
                  }
                >
                  <Icon name="plus" size={13} />
                  {t`Add condition`}
                </button>
              </div>
            )}
          </div>
          {hasCompleteCondition && (
            <div className="rb-scr-foot">
              {canUsePerValue && (
                <label className="rb-scr-pervalue">
                  <Toggle
                    aria-label={t`Different points per value`}
                    checked={isPerValue}
                    disabled={!canEdit}
                    onChange={(checked) =>
                      update((current) =>
                        checked
                          ? syncRoboostScoreValuePoints(
                              { ...current, mode: 'perValue' },
                              perValueValues,
                            )
                          : { ...current, mode: 'fixed', valuePoints: [] },
                      )
                    }
                  />
                  {t`Different points per value`}
                </label>
              )}
              <span className="rb-sp" />
              {!isPerValue &&
                pointsEditor({
                  action: ruleSet.action,
                  points: ruleSet.points,
                  label: t`Points`,
                  onAction: (action) =>
                    update((current) => ({ ...current, action })),
                  onPoints: (points) =>
                    update((current) => ({ ...current, points })),
                })}
            </div>
          )}
          {isPerValue && (
            <ul className="rb-scr-values">
              {ruleSet.valuePoints.map((valuePoint) => {
                const isMatched =
                  result?.matchedValues.includes(valuePoint.value) === true;
                const shownValue = valueLabel(valuePoint.value);

                return (
                  <li
                    key={valuePoint.value}
                    className={cx(isMatched && 'is-matched')}
                  >
                    <span className="rb-truncate">{shownValue}</span>
                    {isMatched && (
                      <Icon name="check" size={13} className="rb-scr-match" />
                    )}
                    <span className="rb-sp" />
                    {pointsEditor({
                      action: valuePoint.action,
                      points: valuePoint.points,
                      label: t`Points for ${shownValue}`,
                      onAction: (action) =>
                        update((current) => ({
                          ...current,
                          valuePoints: current.valuePoints.map((item) =>
                            item.value === valuePoint.value
                              ? { ...item, action }
                              : item,
                          ),
                        })),
                      onPoints: (points) =>
                        update((current) => ({
                          ...current,
                          valuePoints: current.valuePoints.map((item) =>
                            item.value === valuePoint.value
                              ? { ...item, points }
                              : item,
                          ),
                        })),
                    })}
                  </li>
                );
              })}
            </ul>
          )}
          {isInvalidPoints && hasCompleteCondition && (
            <div className="rb-sc-inline-warning">
              <Icon name="alert-triangle" size={13} />
              {t`Enter the points (0 or more, one decimal).`}
            </div>
          )}
        </>
      )}
      {isDeleteOpen && (
        <Modal
          tone="danger"
          title={t`Delete this rule set?`}
          subtitle={t`All its conditions are deleted at once.`}
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
                    deleteRoboostScoreRuleSet(criteria, groupId, ruleSet.id),
                  );
                }}
              >
                {t`Delete rule set`}
              </Button>
            </>
          }
        />
      )}
    </div>
  );
};
