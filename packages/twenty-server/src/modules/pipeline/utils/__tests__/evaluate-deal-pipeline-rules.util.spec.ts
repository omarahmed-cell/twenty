import { DEFAULT_PIPELINE_RULES } from 'twenty-shared/utils';

import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';
import {
  describeDealRuleOverride,
  evaluateDealPipelineRules,
} from 'src/modules/pipeline/utils/evaluate-deal-pipeline-rules.util';

const stage = (
  pipelineKey: string,
  value: string,
  label: string,
  position: number,
  probability: number | null,
) => ({
  id: value,
  pipelineId: pipelineKey,
  label,
  value,
  position,
  color: null,
  probability,
  hubspotStageId: null,
  calcPropsEnabled: false,
  conditionalRules: [],
});

const SALES: PipelineConfig = {
  id: 'SALES_PIPELINE',
  key: 'SALES_PIPELINE',
  name: 'Sales Pipeline',
  description: null,
  position: 0,
  objectNameSingular: 'opportunity',
  hubspotPipelineId: null,
  rules: {
    limitCreationToStages: { enabled: true, stageValues: ['SALES_DISCOVERY'] },
    restrictSkipping: true,
    restrictBackward: true,
    lockEditingInStages: { enabled: true, stageValues: ['SALES_WON'] },
  },
  stages: [
    stage('SALES_PIPELINE', 'SALES_DISCOVERY', '1. Discovery Stage', 0, 10),
    stage('SALES_PIPELINE', 'SALES_QUALIFIED', '2. Qualified to buy', 1, 20),
    stage(
      'SALES_PIPELINE',
      'SALES_COMMERCIAL',
      '3. Commercial Agreement',
      2,
      40,
    ),
    stage('SALES_PIPELINE', 'SALES_WON', '7. Closed Won - Paid', 3, 100),
    stage('SALES_PIPELINE', 'SALES_DISCOVERY_LOST', 'Discovery Lost', 4, 0),
  ],
};

const PILOT: PipelineConfig = {
  ...SALES,
  id: 'PILOT_PIPELINE',
  key: 'PILOT_PIPELINE',
  name: 'Pilot',
  rules: DEFAULT_PIPELINE_RULES,
  stages: [
    stage('PILOT_PIPELINE', 'PILOT_DISCOVERY', 'Discovery', 0, 20),
    stage('PILOT_PIPELINE', 'PILOT_SIGNED', 'Signed', 1, 90),
    stage('PILOT_PIPELINE', 'PILOT_WON', 'Closed Won', 2, 100),
  ],
};

const PIPELINES = [SALES, PILOT];

const sales = (stageValue: string, closeDate: string | null = null) => ({
  pipeline: 'SALES_PIPELINE',
  stage: stageValue,
  closeDate,
});

describe('evaluateDealPipelineRules', () => {
  it('refuses a member creating a deal outside the creation stages, and allows Discovery', () => {
    expect(
      evaluateDealPipelineRules({
        operation: 'create',
        actorKind: 'MEMBER',
        pipelines: PIPELINES,
        next: sales('SALES_QUALIFIED'),
      }),
    ).toMatchObject({
      status: 'refused',
      violation: {
        kind: 'CREATION_STAGE',
        allowedLabels: ['1. Discovery Stage'],
      },
    });
    expect(
      evaluateDealPipelineRules({
        operation: 'create',
        actorKind: 'MEMBER',
        pipelines: PIPELINES,
        next: sales('SALES_DISCOVERY'),
      }),
    ).toEqual({ status: 'allowed' });
  });

  it('refuses a member skipping a stage, allows the next one and any lost stage', () => {
    const update = (from: string, to: string) =>
      evaluateDealPipelineRules({
        operation: 'update',
        actorKind: 'MEMBER',
        pipelines: PIPELINES,
        current: sales(from),
        next: { pipeline: 'SALES_PIPELINE', stage: to },
        changedFieldNames: ['stage'],
      });

    expect(update('SALES_DISCOVERY', 'SALES_COMMERCIAL')).toMatchObject({
      status: 'refused',
      violation: { kind: 'STAGE_MOVE', refusal: { reason: 'SKIP' } },
    });
    expect(update('SALES_DISCOVERY', 'SALES_QUALIFIED')).toEqual({
      status: 'allowed',
    });
    expect(update('SALES_QUALIFIED', 'SALES_DISCOVERY_LOST')).toEqual({
      status: 'allowed',
    });
    expect(update('SALES_DISCOVERY_LOST', 'SALES_QUALIFIED')).toMatchObject({
      status: 'refused',
      violation: { refusal: { reason: 'OUT_OF_CLOSED_STAGE' } },
    });
  });

  it('lets an Admin through and describes the override', () => {
    const result = evaluateDealPipelineRules({
      operation: 'update',
      actorKind: 'ADMIN',
      pipelines: PIPELINES,
      current: sales('SALES_COMMERCIAL'),
      next: { pipeline: 'SALES_PIPELINE', stage: 'SALES_QUALIFIED' },
      changedFieldNames: ['stage'],
    });

    expect(result.status).toBe('overridden');
    expect(
      result.status === 'overridden' &&
        describeDealRuleOverride({
          violation: result.violations[0],
          actorName: 'Omar Ahmed',
        }),
    ).toBe(
      'Moved backward from 3. Commercial Agreement to 2. Qualified to buy by Omar Ahmed (Super Admin override)',
    );
  });

  it('lets workflows and imports through without an override', () => {
    for (const actorKind of ['WORKFLOW', 'IMPORT'] as const) {
      expect(
        evaluateDealPipelineRules({
          operation: 'update',
          actorKind,
          pipelines: PIPELINES,
          current: sales('SALES_DISCOVERY'),
          next: { pipeline: 'SALES_PIPELINE', stage: 'SALES_COMMERCIAL' },
          changedFieldNames: ['stage'],
        }),
      ).toEqual({ status: 'allowed' });
    }
  });

  it('locks deals in the chosen stages for members, edits and deletes alike', () => {
    expect(
      evaluateDealPipelineRules({
        operation: 'update',
        actorKind: 'MEMBER',
        pipelines: PIPELINES,
        current: sales('SALES_WON'),
        next: { pipeline: 'SALES_PIPELINE', stage: 'SALES_WON' },
        changedFieldNames: ['amount'],
      }),
    ).toMatchObject({
      status: 'refused',
      violation: { kind: 'LOCKED', stageLabel: '7. Closed Won - Paid' },
    });
    expect(
      evaluateDealPipelineRules({
        operation: 'delete',
        actorKind: 'MEMBER',
        pipelines: PIPELINES,
        current: sales('SALES_WON'),
      }),
    ).toMatchObject({ status: 'refused', violation: { isDelete: true } });
  });

  it('refuses a member changing Close Date, but not leaving it as it is', () => {
    const update = (closeDate: string | null) =>
      evaluateDealPipelineRules({
        operation: 'update',
        actorKind: 'MEMBER',
        pipelines: PIPELINES,
        current: sales('SALES_DISCOVERY', '2026-11-16T00:00:00.000Z'),
        next: {
          pipeline: 'SALES_PIPELINE',
          stage: 'SALES_DISCOVERY',
          closeDate,
        },
        changedFieldNames: ['closeDate'],
      });

    expect(update('2026-12-01T00:00:00.000Z')).toMatchObject({
      status: 'refused',
      violation: { kind: 'CLOSE_DATE' },
    });
    expect(update('2026-11-16T00:00:00+00:00')).toEqual({ status: 'allowed' });
  });

  it('treats a pipeline change as entering the new pipeline first stage', () => {
    const toPipeline = (pipeline: string, stageValue: string) =>
      evaluateDealPipelineRules({
        operation: 'update',
        actorKind: 'MEMBER',
        pipelines: PIPELINES,
        current: { pipeline: 'PILOT_PIPELINE', stage: 'PILOT_SIGNED' },
        next: { pipeline, stage: stageValue },
        changedFieldNames: ['pipeline', 'stage'],
      });

    expect(toPipeline('SALES_PIPELINE', 'SALES_DISCOVERY')).toEqual({
      status: 'allowed',
    });
    expect(toPipeline('SALES_PIPELINE', 'SALES_QUALIFIED')).toMatchObject({
      status: 'refused',
      violation: { kind: 'PIPELINE_CHANGE', pipelineName: 'Sales Pipeline' },
    });
  });

  it('leaves a pipeline with its rules off alone', () => {
    expect(
      evaluateDealPipelineRules({
        operation: 'update',
        actorKind: 'MEMBER',
        pipelines: PIPELINES,
        current: { pipeline: 'PILOT_PIPELINE', stage: 'PILOT_WON' },
        next: { pipeline: 'PILOT_PIPELINE', stage: 'PILOT_DISCOVERY' },
        changedFieldNames: ['stage'],
      }),
    ).toEqual({ status: 'allowed' });
  });
});
