import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { RoboostRecordPicker } from '@/roboost-app/fields/RoboostRecordPicker';
import { isRoboostListableField } from '@/roboost-app/list/hooks/useRoboostViewColumns';
import {
  type RoboostAdvancedFilter,
  type RoboostFilterOperand,
  type RoboostFilterRule,
} from '@/roboost-app/list/types/RoboostListFilters';
import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Select } from '@/roboost-ui/components/Select';
import { useLingui } from '@lingui/react/macro';
import { isString } from '@sniptt/guards';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

type OperandGroup =
  | 'text'
  | 'number'
  | 'select'
  | 'date'
  | 'relation'
  | 'boolean';

const getOperandGroup = (field: FieldMetadataItem): OperandGroup | null => {
  switch (field.type) {
    case FieldMetadataType.NUMBER:
    case FieldMetadataType.NUMERIC:
    case FieldMetadataType.CURRENCY:
      return 'number';
    case FieldMetadataType.SELECT:
    case FieldMetadataType.MULTI_SELECT:
    case FieldMetadataType.RATING:
      return 'select';
    case FieldMetadataType.DATE:
    case FieldMetadataType.DATE_TIME:
      return 'date';
    case FieldMetadataType.BOOLEAN:
      return 'boolean';
    case FieldMetadataType.RELATION:
      return field.relation?.type === RelationType.MANY_TO_ONE
        ? 'relation'
        : null;
    case FieldMetadataType.TEXT:
    case FieldMetadataType.LINKS:
    case FieldMetadataType.EMAILS:
    case FieldMetadataType.PHONES:
    case FieldMetadataType.FULL_NAME:
      return 'text';
    default:
      return null;
  }
};

type RoboostAdvancedFiltersModalProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  value: RoboostAdvancedFilter;
  onApply: (value: RoboostAdvancedFilter) => void;
  onClose: () => void;
};

export const RoboostAdvancedFiltersModal = ({
  objectMetadataItem,
  value,
  onApply,
  onClose,
}: RoboostAdvancedFiltersModalProps) => {
  const { t } = useLingui();
  const [draft, setDraft] = useState(value);
  const [relationLabels, setRelationLabels] = useState<Record<string, string>>(
    {},
  );

  const filterableFields = objectMetadataItem.fields
    .filter(
      (field) =>
        isRoboostListableField(field) && getOperandGroup(field) !== null,
    )
    .sort((first, second) => first.label.localeCompare(second.label));

  const operandLabels: Record<RoboostFilterOperand, string> = {
    contains: t`contains`,
    doesNotContain: t`does not contain`,
    is: t`is`,
    isNot: t`is not`,
    isAnyOf: t`is any of`,
    isNoneOf: t`is none of`,
    greaterThan: t`is at least`,
    lessThan: t`is at most`,
    before: t`is before`,
    after: t`is on or after`,
    isEmpty: t`is empty`,
    isNotEmpty: t`is not empty`,
  };

  const operandsByGroup: Record<OperandGroup, RoboostFilterOperand[]> = {
    text: ['contains', 'doesNotContain', 'isEmpty', 'isNotEmpty'],
    number: ['is', 'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty'],
    select: ['isAnyOf', 'isNoneOf', 'isEmpty', 'isNotEmpty'],
    date: ['after', 'before', 'isEmpty', 'isNotEmpty'],
    relation: ['is', 'isNot', 'isEmpty', 'isNotEmpty'],
    boolean: ['is'],
  };

  const updateRule = (ruleId: string, update: Partial<RoboostFilterRule>) =>
    setDraft({
      ...draft,
      rules: draft.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...update } : rule,
      ),
    });

  const addRule = () => {
    const field = filterableFields[0];

    if (!isDefined(field)) {
      return;
    }
    const group = getOperandGroup(field) ?? 'text';

    setDraft({
      ...draft,
      rules: [
        ...draft.rules,
        {
          id: v4(),
          fieldName: field.name,
          operand: operandsByGroup[group][0],
          value: null,
        },
      ],
    });
  };

  const renderValue = (rule: RoboostFilterRule, field: FieldMetadataItem) => {
    if (rule.operand === 'isEmpty' || rule.operand === 'isNotEmpty') {
      return <span className="rb-af-novalue" />;
    }
    const group = getOperandGroup(field);

    if (group === 'select') {
      const selected = Array.isArray(rule.value) ? rule.value : [];

      return (
        <div className="rb-af-options">
          {[...(field.options ?? [])]
            .sort((first, second) => first.position - second.position)
            .map((option) => (
              <Checkbox
                key={option.value}
                checked={selected.includes(option.value)}
                onChange={(checked) =>
                  updateRule(rule.id, {
                    value: checked
                      ? [...selected, option.value]
                      : selected.filter((item) => item !== option.value),
                  })
                }
              >
                {option.label}
              </Checkbox>
            ))}
        </div>
      );
    }
    if (group === 'relation') {
      const selectedId = Array.isArray(rule.value) ? rule.value[0] : null;

      return (
        <RoboostRecordPicker
          objectNameSingular={
            field.relation?.targetObjectMetadata.nameSingular ?? ''
          }
          selectedLabel={
            isDefined(selectedId) ? (relationLabels[selectedId] ?? '') : ''
          }
          isClearable={false}
          onSelect={(record) => {
            if (record !== null) {
              setRelationLabels({
                ...relationLabels,
                [record.id]: record.label,
              });
              updateRule(rule.id, { value: [record.id] });
            }
          }}
        />
      );
    }
    if (group === 'boolean') {
      return (
        <Select
          value={isString(rule.value) ? rule.value : 'true'}
          options={[
            { value: 'true', label: t`Yes` },
            { value: 'false', label: t`No` },
          ]}
          onChange={(nextValue) => updateRule(rule.id, { value: nextValue })}
        />
      );
    }

    return (
      <Input
        size="sm"
        type={
          group === 'number' ? 'number' : group === 'date' ? 'date' : 'text'
        }
        value={isString(rule.value) ? rule.value : ''}
        aria-label={t`Value`}
        onChange={(event) => updateRule(rule.id, { value: event.target.value })}
      />
    );
  };

  return createPortal(
    <div className="rb-ui rb-overlay-layer">
      <div className="rb-cscrim" onClick={onClose} />
      <div
        className="rb-cols-modal rb-af-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="rb-cm-head">
          <div className="rb-cm-title">{t`Advanced filters`}</div>
          <div className="rb-cm-sub">
            {t`Show ${objectMetadataItem.labelPlural.toLowerCase()} that match these conditions.`}
          </div>
        </div>
        <div className="rb-af-body">
          {draft.rules.length > 1 && (
            <div className="rb-af-conj">
              {t`Match`}
              <Select
                value={draft.conjunction}
                options={[
                  { value: 'and', label: t`all conditions` },
                  { value: 'or', label: t`any condition` },
                ]}
                onChange={(conjunction) =>
                  setDraft({
                    ...draft,
                    conjunction: conjunction as 'and' | 'or',
                  })
                }
              />
            </div>
          )}
          {draft.rules.length === 0 && (
            <div className="rb-af-empty">{t`No conditions yet. Add one to narrow the list.`}</div>
          )}
          {draft.rules.map((rule) => {
            const field = filterableFields.find(
              (candidate) => candidate.name === rule.fieldName,
            );

            if (!isDefined(field)) {
              return null;
            }
            const group = getOperandGroup(field) ?? 'text';

            return (
              <div key={rule.id} className="rb-af-rule">
                <Select
                  aria-label={t`Property`}
                  value={rule.fieldName}
                  options={filterableFields.map((candidate) => ({
                    value: candidate.name,
                    label: candidate.label,
                  }))}
                  onChange={(fieldName) => {
                    const nextField = filterableFields.find(
                      (candidate) => candidate.name === fieldName,
                    );
                    const nextGroup = isDefined(nextField)
                      ? (getOperandGroup(nextField) ?? 'text')
                      : 'text';

                    updateRule(rule.id, {
                      fieldName,
                      operand: operandsByGroup[nextGroup][0],
                      value: null,
                    });
                  }}
                />
                <Select
                  aria-label={t`Condition`}
                  value={rule.operand}
                  options={operandsByGroup[group].map((operand) => ({
                    value: operand,
                    label: operandLabels[operand],
                  }))}
                  onChange={(operand) =>
                    updateRule(rule.id, {
                      operand: operand as RoboostFilterOperand,
                    })
                  }
                />
                <div className="rb-af-value">{renderValue(rule, field)}</div>
                <button
                  type="button"
                  className="rb-icon-btn rb-icon-btn-sm rb-icon-btn-ghost"
                  aria-label={t`Remove condition`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      rules: draft.rules.filter(
                        (candidate) => candidate.id !== rule.id,
                      ),
                    })
                  }
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            );
          })}
          <div>
            <Button variant="ghost" size="sm" icon="plus" onClick={addRule}>
              {t`Add condition`}
            </Button>
          </div>
        </div>
        <div className="rb-cm-foot">
          <button
            type="button"
            className="rb-cm-remove"
            onClick={() => setDraft({ ...draft, rules: [] })}
          >
            {t`Clear all`}
          </button>
          <span style={{ flex: 1 }} />
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button variant="primary" onClick={() => onApply(draft)}>
            {t`Apply`}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
