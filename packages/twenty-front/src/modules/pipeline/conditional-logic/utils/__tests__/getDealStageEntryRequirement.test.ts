import { FieldMetadataType } from 'twenty-shared/types';
import {
  type ConditionalLogicField,
  type ConditionalLogicRule,
} from 'twenty-shared/utils';

import {
  getDealBulkEditStageEntryRefusal,
  getDealBulkStageEntryRefusal,
} from '@/pipeline/conditional-logic/utils/getDealBulkStageEntryRefusal';
import { getDealStageEntryRequirement } from '@/pipeline/conditional-logic/utils/getDealStageEntryRequirement';
import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';

const FIELDS: ConditionalLogicField[] = [
  { name: 'dealType', label: 'Deal Type', type: FieldMetadataType.SELECT },
  {
    name: 'closedLostReason',
    label: 'Closed Lost Reason',
    type: FieldMetadataType.SELECT,
  },
  {
    name: 'closedLostContext',
    label: 'Closed Lost Context',
    type: FieldMetadataType.TEXT,
  },
  {
    name: 'contractFrequency',
    label: 'Contract Frequency',
    type: FieldMetadataType.SELECT,
  },
];

const CLOSED_LOST_RULES: ConditionalLogicRule[] = [
  {
    id: 'lost',
    conditionGroups: [{ id: 'g', conditions: [] }],
    properties: [
      { fieldName: 'closedLostReason', isRequired: true },
      { fieldName: 'closedLostContext', isRequired: false },
    ],
  },
];

const LEGAL_RULES: ConditionalLogicRule[] = [
  {
    id: 'legal',
    conditionGroups: [
      {
        id: 'g',
        conditions: [
          {
            id: 'c',
            fieldName: 'dealType',
            operator: 'IS_ANY_OF',
            value: ['NEW_BUSINESS'],
          },
        ],
      },
    ],
    properties: [{ fieldName: 'contractFrequency', isRequired: true }],
  },
];

const stage = (
  value: string,
  label: string,
  position: number,
  conditionalRules: ConditionalLogicRule[] = [],
) => ({
  id: value,
  pipelineId: 'sales',
  value,
  label,
  position,
  color: null,
  probability: null,
  hubspotStageId: null,
  calcPropsEnabled: false,
  conditionalRules,
});

const SALES: PipelineConfig = {
  id: 'sales',
  key: 'SALES_PIPELINE',
  name: 'Sales Pipeline',
  description: null,
  position: 0,
  objectNameSingular: 'opportunity',
  rules: {
    limitCreationToStages: { enabled: false, stageValues: [] },
    restrictSkipping: false,
    restrictBackward: false,
    lockEditingInStages: { enabled: false, stageValues: [] },
  },
  stages: [
    stage('SALES_DISCOVERY', '1. Discovery Stage', 0),
    stage('SALES_LEGAL', '4. Legal Agreement', 1, LEGAL_RULES),
    stage('SALES_CLOSED_LOST', '8. Closed Lost', 2, CLOSED_LOST_RULES),
  ],
};

const deal = (overrides: Record<string, unknown> = {}) => ({
  id: 'deal',
  pipeline: 'SALES_PIPELINE',
  stage: 'SALES_DISCOVERY',
  dealType: 'NEW_BUSINESS',
  closedLostReason: null,
  closedLostContext: null,
  contractFrequency: null,
  ...overrides,
});

const requirementFor = (
  record: Record<string, unknown>,
  targetStageValue: string,
) =>
  getDealStageEntryRequirement({
    pipelines: [SALES],
    record,
    targetStageValue,
    fields: FIELDS,
  });

describe('getDealStageEntryRequirement', () => {
  it('lists the shown properties and the missing required ones', () => {
    const requirement = requirementFor(deal(), 'SALES_CLOSED_LOST');

    expect(requirement?.properties).toEqual([
      { fieldName: 'closedLostReason', isRequired: true },
      { fieldName: 'closedLostContext', isRequired: false },
    ]);
    expect(
      requirement?.missingRequiredFields.map(({ label }) => label),
    ).toEqual(['Closed Lost Reason']);
    expect(requirement?.isDialogNeeded).toBe(true);
  });

  it('still opens the dialog for shown-only properties once required ones are filled', () => {
    const requirement = requirementFor(
      deal({ closedLostReason: 'NO_BUDGET' }),
      'SALES_CLOSED_LOST',
    );

    expect(requirement?.missingRequiredFields).toEqual([]);
    expect(requirement?.isDialogNeeded).toBe(true);
  });

  it('moves straight away when every property is required and filled', () => {
    expect(
      requirementFor(deal({ contractFrequency: 'YEARS_1' }), 'SALES_LEGAL')
        ?.isDialogNeeded,
    ).toBe(false);
  });

  it('skips stages whose rule conditions do not match, and stages without rules', () => {
    expect(
      requirementFor(deal({ dealType: 'EXISTING_BUSINESS' }), 'SALES_LEGAL'),
    ).toBeNull();
    expect(requirementFor(deal(), 'SALES_DISCOVERY')).toBeNull();
  });

  it('only applies when the deal enters the stage', () => {
    expect(
      requirementFor(deal({ stage: 'SALES_CLOSED_LOST' }), 'SALES_CLOSED_LOST'),
    ).toBeNull();
  });
});

describe('getDealBulkStageEntryRefusal', () => {
  it('refuses when any deal misses a required field', () => {
    expect(
      getDealBulkStageEntryRefusal([
        requirementFor(
          deal({ closedLostReason: 'NO_BUDGET' }),
          'SALES_CLOSED_LOST',
        ),
        requirementFor(deal(), 'SALES_CLOSED_LOST'),
      ]),
    ).toBe(
      'Move these deals one by one: 8. Closed Lost requires Closed Lost Reason',
    );
  });

  it('lets the move through when every deal has its required fields', () => {
    expect(
      getDealBulkStageEntryRefusal([
        requirementFor(
          deal({ closedLostReason: 'NO_BUDGET' }),
          'SALES_CLOSED_LOST',
        ),
        null,
      ]),
    ).toBeNull();
  });
});

describe('getDealBulkEditStageEntryRefusal', () => {
  const closedLost = SALES.stages[2];

  it('refuses unless the edit sets every required field itself', () => {
    expect(
      getDealBulkEditStageEntryRefusal({
        stage: closedLost,
        fields: FIELDS,
        providedFieldNames: ['stage'],
      }),
    ).toBe(
      'Move these deals one by one: 8. Closed Lost requires Closed Lost Reason',
    );
    expect(
      getDealBulkEditStageEntryRefusal({
        stage: closedLost,
        fields: FIELDS,
        providedFieldNames: ['stage', 'closedLostReason'],
      }),
    ).toBeNull();
  });
});
