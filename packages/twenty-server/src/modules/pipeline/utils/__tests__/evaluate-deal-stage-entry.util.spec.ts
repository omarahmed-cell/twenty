import { FieldMetadataType } from 'twenty-shared/types';
import {
  type ConditionalLogicField,
  type ConditionalLogicRule,
  DEFAULT_PIPELINE_RULES,
} from 'twenty-shared/utils';

import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';
import { type DealRuleActorKind } from 'src/modules/pipeline/utils/evaluate-deal-pipeline-rules.util';
import { evaluateDealStageEntry } from 'src/modules/pipeline/utils/evaluate-deal-stage-entry.util';

const CLOSED_LOST_RULE: ConditionalLogicRule = {
  id: 'closed-lost',
  conditionGroups: [{ id: 'group', conditions: [] }],
  properties: [
    { fieldName: 'closedLostReason', isRequired: true },
    { fieldName: 'closedLostContext', isRequired: false },
  ],
};

const LEGAL_RULE: ConditionalLogicRule = {
  id: 'legal',
  conditionGroups: [
    {
      id: 'group',
      conditions: [
        {
          id: 'condition',
          fieldName: 'dealType',
          operator: 'IS_ANY_OF',
          value: ['NEW_BUSINESS'],
        },
      ],
    },
  ],
  properties: [{ fieldName: 'contractFrequency', isRequired: true }],
};

const stage = (
  value: string,
  label: string,
  position: number,
  conditionalRules: ConditionalLogicRule[] = [],
) => ({
  id: value,
  pipelineId: 'sales',
  label,
  value,
  position,
  color: null,
  probability: null,
  hubspotStageId: null,
  calcPropsEnabled: false,
  conditionalRules,
});

const PIPELINES: PipelineConfig[] = [
  {
    id: 'sales',
    key: 'SALES_PIPELINE',
    name: 'Sales Pipeline',
    description: null,
    position: 0,
    objectNameSingular: 'opportunity',
    hubspotPipelineId: null,
    rules: DEFAULT_PIPELINE_RULES,
    stages: [
      stage('SALES_DISCOVERY', '1. Discovery Stage', 0),
      stage('SALES_LEGAL', '4. Legal Agreement', 1, [LEGAL_RULE]),
      stage('SALES_CLOSED_LOST', '8. Closed Lost', 2, [CLOSED_LOST_RULE]),
    ],
  },
];

const FIELDS: ConditionalLogicField[] = [
  { name: 'dealType', label: 'Deal Type', type: FieldMetadataType.SELECT },
  {
    name: 'contractFrequency',
    label: 'Contract Frequency',
    type: FieldMetadataType.SELECT,
  },
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
];

const move = ({
  to,
  record = {},
  from = 'SALES_DISCOVERY',
  actorKind = 'MEMBER',
}: {
  to: string;
  record?: Record<string, unknown>;
  from?: string;
  actorKind?: DealRuleActorKind;
}) =>
  evaluateDealStageEntry({
    operation: 'update',
    actorKind,
    pipelines: PIPELINES,
    current: { pipeline: 'SALES_PIPELINE', stage: from },
    next: { pipeline: 'SALES_PIPELINE', stage: to },
    record: { ...record, pipeline: 'SALES_PIPELINE', stage: to },
    fields: FIELDS,
  });

describe('evaluateDealStageEntry', () => {
  it('refuses entering a stage while a required property is empty, naming it', () => {
    expect(move({ to: 'SALES_CLOSED_LOST' })).toEqual({
      operation: 'update',
      stageLabel: '8. Closed Lost',
      missingFieldLabels: ['Closed Lost Reason'],
    });
    expect(
      move({
        to: 'SALES_CLOSED_LOST',
        record: { closedLostReason: 'NO_BUDGET' },
      }),
    ).toBeNull();
  });

  it('never requires a shown-only property', () => {
    expect(
      move({
        to: 'SALES_CLOSED_LOST',
        record: { closedLostReason: 'NO_BUDGET', closedLostContext: null },
      }),
    ).toBeNull();
  });

  it('only checks on entry, not on later edits in the same stage', () => {
    expect(
      move({ from: 'SALES_CLOSED_LOST', to: 'SALES_CLOSED_LOST' }),
    ).toBeNull();
  });

  it('checks a deal created straight into the stage', () => {
    expect(
      evaluateDealStageEntry({
        operation: 'create',
        actorKind: 'MEMBER',
        pipelines: PIPELINES,
        next: { pipeline: 'SALES_PIPELINE', stage: 'SALES_CLOSED_LOST' },
        record: { stage: 'SALES_CLOSED_LOST' },
        fields: FIELDS,
      }),
    ).toMatchObject({ operation: 'create', stageLabel: '8. Closed Lost' });
  });

  it('applies to Admins too', () => {
    expect(
      move({ to: 'SALES_CLOSED_LOST', actorKind: 'ADMIN' }),
    ).not.toBeNull();
  });

  it('lets workflows, imports and the server through', () => {
    for (const actorKind of ['WORKFLOW', 'IMPORT', 'SYSTEM'] as const) {
      expect(move({ to: 'SALES_CLOSED_LOST', actorKind })).toBeNull();
    }
  });

  it('requires only when the rule conditions hold', () => {
    expect(
      move({ to: 'SALES_LEGAL', record: { dealType: 'NEW_BUSINESS' } }),
    ).toMatchObject({ missingFieldLabels: ['Contract Frequency'] });
    expect(
      move({ to: 'SALES_LEGAL', record: { dealType: 'EXISTING_BUSINESS' } }),
    ).toBeNull();
  });
});
