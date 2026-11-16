import { FieldMetadataType } from 'twenty-shared/types';
import { type ConditionalLogicField } from 'twenty-shared/utils';

import { buildConditionalLogicPreviewRecord } from '@/settings/data-model/pipelines/conditional-logic/utils/buildConditionalLogicPreviewRecord';
import {
  addConditionalLogicCondition,
  addConditionalLogicGroup,
  addConditionalLogicProperty,
  changeConditionalLogicConditionField,
  changeConditionalLogicConditionOperator,
  changeConditionalLogicConditionValue,
  createConditionalLogicRuleDraft,
  isConditionalLogicRuleDraftValid,
  moveConditionalLogicProperty,
  removeConditionalLogicCondition,
  removeConditionalLogicGroup,
  removeConditionalLogicRule,
  setConditionalLogicPropertyRequired,
  upsertConditionalLogicRule,
} from '@/settings/data-model/pipelines/conditional-logic/utils/conditionalLogicRuleDraft';
import { countPipelineConditionalLogicRules } from '@/settings/data-model/pipelines/utils/countPipelineConditionalLogicRules';

const DEAL_TYPE: ConditionalLogicField = {
  name: 'dealType',
  label: 'Deal Type',
  type: FieldMetadataType.SELECT,
};
const SEATS: ConditionalLogicField = {
  name: 'seats',
  label: 'Seats',
  type: FieldMetadataType.NUMBER,
};
const OWNER: ConditionalLogicField = {
  name: 'owner',
  label: 'Owner',
  type: FieldMetadataType.RELATION,
  joinColumnName: 'ownerId',
};

describe('conditional logic rule drafts', () => {
  it('starts with one group and no properties, and is not savable yet', () => {
    const draft = createConditionalLogicRuleDraft();

    expect(draft.conditionGroups).toHaveLength(1);
    expect(draft.properties).toEqual([]);
    expect(isConditionalLogicRuleDraftValid(draft)).toBe(false);
  });

  it('adds conditions with the first operator of the field type and resets values on changes', () => {
    const draft = createConditionalLogicRuleDraft();
    const groupId = draft.conditionGroups[0].id;
    const withCondition = addConditionalLogicCondition(
      draft,
      groupId,
      DEAL_TYPE,
    );
    const condition = withCondition.conditionGroups[0].conditions[0];

    expect(condition).toMatchObject({
      fieldName: 'dealType',
      operator: 'IS_ANY_OF',
      value: [],
    });

    const withValue = changeConditionalLogicConditionValue(
      withCondition,
      groupId,
      condition.id,
      ['NEW_BUSINESS'],
    );
    const sameShape = changeConditionalLogicConditionOperator(
      withValue,
      groupId,
      condition.id,
      'IS_NONE_OF',
    );

    expect(sameShape.conditionGroups[0].conditions[0].value).toEqual([
      'NEW_BUSINESS',
    ]);

    const valueless = changeConditionalLogicConditionOperator(
      withValue,
      groupId,
      condition.id,
      'IS_KNOWN',
    );

    expect(valueless.conditionGroups[0].conditions[0].value).toBeUndefined();

    const otherField = changeConditionalLogicConditionField(
      withValue,
      groupId,
      condition.id,
      SEATS,
    );

    expect(otherField.conditionGroups[0].conditions[0]).toMatchObject({
      fieldName: 'seats',
      operator: 'IS_EQUAL_TO',
      value: null,
    });
    expect(
      removeConditionalLogicCondition(otherField, groupId, condition.id)
        .conditionGroups[0].conditions,
    ).toEqual([]);
  });

  it('keeps at least one group', () => {
    const draft = createConditionalLogicRuleDraft();
    const twoGroups = addConditionalLogicGroup(draft);

    expect(twoGroups.conditionGroups).toHaveLength(2);
    expect(
      removeConditionalLogicGroup(twoGroups, twoGroups.conditionGroups[1].id)
        .conditionGroups,
    ).toHaveLength(1);
    expect(
      removeConditionalLogicGroup(draft, draft.conditionGroups[0].id)
        .conditionGroups,
    ).toHaveLength(1);
  });

  it('adds properties as required, toggles, reorders and validates', () => {
    const draft = addConditionalLogicProperty(
      addConditionalLogicProperty(
        createConditionalLogicRuleDraft(),
        'closedLostReason',
      ),
      'closedLostContext',
    );

    expect(addConditionalLogicProperty(draft, 'closedLostReason')).toBe(draft);
    expect(draft.properties).toEqual([
      { fieldName: 'closedLostReason', isRequired: true },
      { fieldName: 'closedLostContext', isRequired: true },
    ]);

    const optional = setConditionalLogicPropertyRequired(
      draft,
      'closedLostContext',
      false,
    );
    const moved = moveConditionalLogicProperty(optional, 1, 0);

    expect(moved.properties).toEqual([
      { fieldName: 'closedLostContext', isRequired: false },
      { fieldName: 'closedLostReason', isRequired: true },
    ]);
    expect(isConditionalLogicRuleDraftValid(moved)).toBe(true);

    const incomplete = addConditionalLogicCondition(
      moved,
      moved.conditionGroups[0].id,
      DEAL_TYPE,
    );

    expect(isConditionalLogicRuleDraftValid(incomplete)).toBe(false);
  });

  it('inserts, replaces, removes and counts rules', () => {
    const first = createConditionalLogicRuleDraft();
    const second = createConditionalLogicRuleDraft();
    const rules = upsertConditionalLogicRule(
      upsertConditionalLogicRule([], first),
      second,
    );
    const edited = {
      ...first,
      properties: [{ fieldName: 'x', isRequired: true }],
    };

    expect(upsertConditionalLogicRule(rules, edited)).toEqual([edited, second]);
    expect(removeConditionalLogicRule(rules, first.id)).toEqual([second]);
    expect(
      countPipelineConditionalLogicRules([
        { conditionalRules: rules },
        { conditionalRules: [] },
        { conditionalRules: [first] },
      ]),
    ).toBe(3);
  });
});

describe('buildConditionalLogicPreviewRecord', () => {
  it('maps relation picks to the foreign key and leaves other fields as typed', () => {
    expect(
      buildConditionalLogicPreviewRecord({
        valuesByFieldName: {
          dealType: 'NEW_BUSINESS',
          owner: { id: 'member-1' },
        },
        fields: [DEAL_TYPE, SEATS, OWNER],
      }),
    ).toEqual({ dealType: 'NEW_BUSINESS', seats: null, ownerId: 'member-1' });
  });
});
