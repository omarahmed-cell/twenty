import { getRoboostZoom } from '@/roboost-ui/utils/getRoboostZoom';
import { type RoboostCardLogic } from '@/roboost-app/layout/types/RoboostRecordLayout';
import {
  describeRoboostCardLogic,
  getRoboostCardLogicOperators,
  getRoboostOperatorLabel,
} from '@/roboost-app/layout/utils/roboostCardLogic';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Select } from '@/roboost-ui/components/Select';
import { Tag } from '@/roboost-ui/components/Tag';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FieldMetadataType } from 'twenty-shared/types';
import {
  type ConditionalLogicCondition,
  type ConditionalLogicConditionGroup,
  type ConditionalLogicField,
  isConditionalLogicListOperator,
  isConditionalLogicOperatorValueless,
  isDefined,
} from 'twenty-shared/utils';
import { v4 } from 'uuid';

const POPOVER_WIDTH = 400;
const VIEWPORT_MARGIN = 12;

const NUMBER_TYPES = new Set<string>([
  FieldMetadataType.NUMBER,
  FieldMetadataType.NUMERIC,
  FieldMetadataType.CURRENCY,
]);
const DATE_TYPES = new Set<string>([
  FieldMetadataType.DATE,
  FieldMetadataType.DATE_TIME,
]);

type RoboostCardLogicPopoverProps = {
  cardTitle: string;
  anchor: DOMRect;
  logic: RoboostCardLogic | undefined;
  fields: ConditionalLogicField[];
  onApply: (logic: RoboostCardLogic | undefined) => void;
  onClose: () => void;
};

export const RoboostCardLogicPopover = ({
  cardTitle,
  anchor,
  logic,
  fields,
  onApply,
  onClose,
}: RoboostCardLogicPopoverProps) => {
  const { t } = useLingui();
  const fieldByName = new Map(fields.map((field) => [field.name, field]));

  const newCondition = (field = fields[0]): ConditionalLogicCondition => ({
    id: v4(),
    fieldName: field?.name ?? '',
    operator: isDefined(field)
      ? getRoboostCardLogicOperators(field)[0]
      : 'IS_KNOWN',
    value: null,
  });

  const [action, setAction] = useState<RoboostCardLogic['action']>(
    logic?.action ?? 'show',
  );
  const [groups, setGroups] = useState<ConditionalLogicConditionGroup[]>(
    isDefined(logic) && logic.conditionGroups.length > 0
      ? logic.conditionGroups
      : [{ id: v4(), conditions: [newCondition()] }],
  );

  const updateCondition = (
    groupId: string,
    conditionId: string,
    patch: Partial<ConditionalLogicCondition>,
  ) =>
    setGroups(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map((condition) =>
                condition.id === conditionId
                  ? { ...condition, ...patch }
                  : condition,
              ),
            }
          : group,
      ),
    );

  const removeCondition = (groupId: string, conditionId: string) =>
    setGroups(
      groups
        .map((group) =>
          group.id === groupId
            ? {
                ...group,
                conditions: group.conditions.filter(
                  (condition) => condition.id !== conditionId,
                ),
              }
            : group,
        )
        .filter((group) => group.conditions.length > 0),
    );

  const cleanGroups = groups
    .map((group) => ({
      ...group,
      conditions: group.conditions.filter(
        (condition) =>
          fieldByName.has(condition.fieldName) &&
          (isConditionalLogicOperatorValueless(condition.operator) ||
            (Array.isArray(condition.value)
              ? condition.value.length > 0
              : isDefined(condition.value) && condition.value !== '')),
      ),
    }))
    .filter((group) => group.conditions.length > 0);
  const draftLogic: RoboostCardLogic = { action, conditionGroups: cleanGroups };
  const summary = describeRoboostCardLogic({
    cardTitle,
    logic: draftLogic,
    fieldByName,
  });

  const left = Math.min(
    anchor.right + 8,
    window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN,
  );
  const top = Math.max(
    VIEWPORT_MARGIN,
    Math.min(anchor.top, window.innerHeight - 560),
  );

  const renderValue = (
    group: ConditionalLogicConditionGroup,
    condition: ConditionalLogicCondition,
    field: ConditionalLogicField,
  ) => {
    if (isConditionalLogicOperatorValueless(condition.operator)) {
      return null;
    }
    if (
      isConditionalLogicListOperator(condition.operator) ||
      isDefined(field.options)
    ) {
      const selected = Array.isArray(condition.value)
        ? condition.value
        : isDefined(condition.value)
          ? [String(condition.value)]
          : [];
      const remaining = (field.options ?? []).filter(
        (option) => !selected.includes(option.value),
      );

      return (
        <div className="rb-rve-logic-values">
          {selected.map((value) => (
            <Tag key={value}>
              {field.options?.find((option) => option.value === value)?.label ??
                value}
              <button
                type="button"
                className="rb-rve-tag-x"
                aria-label={t`Remove value`}
                onClick={() =>
                  updateCondition(group.id, condition.id, {
                    value: selected.filter((item) => item !== value),
                  })
                }
              >
                <Icon name="x" size={11} />
              </button>
            </Tag>
          ))}
          {remaining.length > 0 && (
            <Select
              key={selected.join(',')}
              className="rb-rve-logic-add-value"
              placeholder={t`Add value`}
              aria-label={t`Add value`}
              options={remaining.map(({ value, label }) => ({ value, label }))}
              onChange={(value) =>
                updateCondition(group.id, condition.id, {
                  value: [...selected, value],
                })
              }
            />
          )}
        </div>
      );
    }
    const isNumber = NUMBER_TYPES.has(field.type);
    const isDate = DATE_TYPES.has(field.type);

    return (
      <Input
        size="sm"
        type={isNumber ? 'number' : isDate ? 'date' : 'text'}
        value={isDefined(condition.value) ? String(condition.value) : ''}
        placeholder={t`Value`}
        aria-label={t`Value`}
        onChange={(event) => {
          const raw = event.target.value;

          updateCondition(group.id, condition.id, {
            value: raw === '' ? null : isNumber ? Number(raw) : raw,
          });
        }}
      />
    );
  };

  return createPortal(
    <div className="rb-ui rb-rve-logic-scrim" onMouseDown={onClose}>
      <div
        className="rb-rve-logic"
        role="dialog"
        aria-label={t`Conditional logic`}
        style={{
          left: left / getRoboostZoom(),
          top: top / getRoboostZoom(),
          width: POPOVER_WIDTH,
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="rb-rve-logic-head">
          <span>{t`Conditional logic`}</span>
          <button
            type="button"
            className="rb-rc-iconbtn"
            aria-label={t`Close`}
            onClick={onClose}
          >
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="rb-rve-logic-body">
          {groups.map((group, groupIndex) => (
            <div key={group.id} className="rb-rve-logic-group">
              {groupIndex > 0 && <div className="rb-rve-logic-or">{t`OR`}</div>}
              {group.conditions.map((condition, conditionIndex) => {
                const field = fieldByName.get(condition.fieldName);

                return (
                  <div key={condition.id} className="rb-rve-logic-cond">
                    <div className="rb-rve-logic-cond-head">
                      <b>
                        {groupIndex === 0 && conditionIndex === 0
                          ? t`If`
                          : conditionIndex === 0
                            ? t`Or if`
                            : t`And`}
                      </b>
                      <span className="rb-sp" />
                      <button
                        type="button"
                        className="rb-rc-iconbtn"
                        aria-label={t`Delete condition`}
                        onClick={() => removeCondition(group.id, condition.id)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                    <Select
                      aria-label={t`Property`}
                      value={condition.fieldName}
                      options={fields.map(({ name, label }) => ({
                        value: name,
                        label,
                      }))}
                      onChange={(fieldName) => {
                        const nextField = fieldByName.get(fieldName);

                        updateCondition(group.id, condition.id, {
                          fieldName,
                          operator: isDefined(nextField)
                            ? getRoboostCardLogicOperators(nextField)[0]
                            : 'IS_KNOWN',
                          value: null,
                        });
                      }}
                    />
                    {isDefined(field) && (
                      <>
                        <Select
                          aria-label={t`Operator`}
                          value={condition.operator}
                          options={getRoboostCardLogicOperators(field).map(
                            (operator) => ({
                              value: operator,
                              label: getRoboostOperatorLabel(operator),
                            }),
                          )}
                          onChange={(operator) =>
                            updateCondition(group.id, condition.id, {
                              operator:
                                operator as ConditionalLogicCondition['operator'],
                              value: null,
                            })
                          }
                        />
                        {renderValue(group, condition, field)}
                      </>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                className="rb-rve-logic-link"
                onClick={() =>
                  setGroups(
                    groups.map((candidate) =>
                      candidate.id === group.id
                        ? {
                            ...candidate,
                            conditions: [
                              ...candidate.conditions,
                              newCondition(),
                            ],
                          }
                        : candidate,
                    ),
                  )
                }
              >
                <Icon name="plus" size={12} />
                {t`AND condition`}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="rb-rve-logic-link"
            onClick={() =>
              setGroups([...groups, { id: v4(), conditions: [newCondition()] }])
            }
          >
            <Icon name="plus" size={12} />
            {t`OR condition group`}
          </button>
          <div className="rb-rve-logic-then">
            <b>{t`Then`}</b>
            <Select
              aria-label={t`Then`}
              value={action}
              options={[
                { value: 'show', label: t`Show` },
                { value: 'hide', label: t`Hide` },
              ]}
              onChange={(value) =>
                setAction(value === 'hide' ? 'hide' : 'show')
              }
            />
          </div>
          <p className="rb-rve-logic-summary">
            {summary.map((part, index) =>
              part.isStrong ? (
                <b key={index}>{part.text}</b>
              ) : (
                <span key={index}>{part.text}</span>
              ),
            )}
          </p>
        </div>
        <div className="rb-rve-logic-foot">
          <Button
            variant="primary"
            onClick={() =>
              onApply(cleanGroups.length > 0 ? draftLogic : undefined)
            }
          >
            {t`Apply`}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t`Cancel`}
          </Button>
          {isDefined(logic) && (
            <>
              <span className="rb-sp" />
              <Button variant="ghost" onClick={() => onApply(undefined)}>
                {t`Remove logic`}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
