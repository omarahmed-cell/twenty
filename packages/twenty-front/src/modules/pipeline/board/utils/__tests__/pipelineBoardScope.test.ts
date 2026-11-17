import { buildPipelineBoardRecordFilter } from '@/pipeline/board/utils/buildPipelineBoardRecordFilter';
import { buildPipelineBoardWeightedAmountByStageValue } from '@/pipeline/board/utils/buildPipelineBoardWeightedAmountByStageValue';
import { getPipelineBoardCreateRecordDefaults } from '@/pipeline/board/utils/getPipelineBoardCreateRecordDefaults';
import { isPipelineBoardDropAllowed } from '@/pipeline/board/utils/isPipelineBoardDropAllowed';
import { isPipelineBoardEligible } from '@/pipeline/board/utils/isPipelineBoardEligible';
import { orderRecordGroupsForPipelineBoardScope } from '@/pipeline/board/utils/orderRecordGroupsForPipelineBoardScope';
import { canCreateInPipelineBoardColumn } from '@/pipeline/board/utils/canCreateInPipelineBoardColumn';
import { resolvePipelineBoardScope } from '@/pipeline/board/utils/resolvePipelineBoardScope';
import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import { DEFAULT_PIPELINE_RULES } from 'twenty-shared/utils';

const buildPipeline = (
  key: string,
  position: number,
  stageValues: string[],
): PipelineConfig => ({
  id: `${key}-id`,
  key,
  name: key,
  description: null,
  position,
  objectNameSingular: 'opportunity',
  stageCalculatedPropertyKinds: [
    'dateEntered',
    'dateExited',
    'cumulativeTimeIn',
    'latestTimeIn',
  ],
  rules: DEFAULT_PIPELINE_RULES,
  stages: stageValues.map((value, index) => ({
    id: `${value}-id`,
    pipelineId: `${key}-id`,
    label: value,
    value,
    position: index,
    color: null,
    probability: null,
    hubspotStageId: null,
    calcPropsEnabled: false,
    conditionalRules: [],
  })),
});

const SALES = buildPipeline('SALES_PIPELINE', 0, [
  'SALES_DISCOVERY_STAGE',
  'SALES_CLOSING',
  'SALES_CLOSED_LOST',
]);
const PILOT = buildPipeline('PILOT_PIPELINE', 1, [
  'PILOT_DISCOVERY',
  'PILOT_CLOSED_WON',
]);

describe('isPipelineBoardEligible', () => {
  it('only applies to deal boards grouped by Deal Stage', () => {
    expect(
      isPipelineBoardEligible({
        objectNameSingular: 'opportunity',
        groupFieldName: 'stage',
      }),
    ).toBe(true);
    expect(
      isPipelineBoardEligible({
        objectNameSingular: 'opportunity',
        groupFieldName: 'pipeline',
      }),
    ).toBe(false);
    expect(
      isPipelineBoardEligible({
        objectNameSingular: 'task',
        groupFieldName: 'stage',
      }),
    ).toBe(false);
  });

  it('applies to service boards grouped by the service Stage', () => {
    expect(
      isPipelineBoardEligible({
        objectNameSingular: 'service',
        groupFieldName: 'stage',
      }),
    ).toBe(true);
    expect(
      isPipelineBoardEligible({
        objectNameSingular: 'service',
        groupFieldName: 'pipeline',
      }),
    ).toBe(false);
  });
});

describe('resolvePipelineBoardScope', () => {
  it('uses the remembered pipeline with its stages in Settings order', () => {
    expect(
      resolvePipelineBoardScope({
        pipelines: [SALES, PILOT],
        rememberedPipelineKey: 'PILOT_PIPELINE',
      }),
    ).toEqual({
      pipelineKey: 'PILOT_PIPELINE',
      stageValues: ['PILOT_DISCOVERY', 'PILOT_CLOSED_WON'],
      pipeline: PILOT,
    });
  });

  it('defaults to the first pipeline, also when the remembered one was deleted', () => {
    expect(
      resolvePipelineBoardScope({
        pipelines: [SALES, PILOT],
        rememberedPipelineKey: undefined,
      })?.pipelineKey,
    ).toBe('SALES_PIPELINE');
    expect(
      resolvePipelineBoardScope({
        pipelines: [SALES, PILOT],
        rememberedPipelineKey: 'GONE_PIPELINE',
      })?.pipelineKey,
    ).toBe('SALES_PIPELINE');
  });

  it('has no scope without pipelines', () => {
    expect(
      resolvePipelineBoardScope({ pipelines: [], rememberedPipelineKey: '' }),
    ).toBeNull();
  });
});

describe('orderRecordGroupsForPipelineBoardScope', () => {
  it("shows only the pipeline's columns, in Settings order, hidden ones included", () => {
    const recordGroups = [
      { id: 'g1', value: 'SALES_CLOSED_LOST', position: 0, isVisible: true },
      { id: 'g2', value: 'PILOT_DISCOVERY', position: 1, isVisible: true },
      {
        id: 'g3',
        value: 'SALES_DISCOVERY_STAGE',
        position: 2,
        isVisible: false,
      },
      { id: 'g4', value: null, position: 3, isVisible: true },
      { id: 'g5', value: 'SALES_CLOSING', position: 4, isVisible: true },
    ];

    const scope = resolvePipelineBoardScope({
      pipelines: [SALES],
      rememberedPipelineKey: 'SALES_PIPELINE',
    });

    expect(scope).not.toBeNull();
    expect(
      orderRecordGroupsForPipelineBoardScope({
        recordGroups,
        scope: scope ?? { pipelineKey: '', stageValues: [], pipeline: SALES },
      }).map(({ id }) => id),
    ).toEqual(['g3', 'g5', 'g1']);
  });
});

describe('isPipelineBoardDropAllowed', () => {
  const scope = {
    pipelineKey: 'SALES_PIPELINE',
    stageValues: SALES.stages.map(({ value }) => value),
    pipeline: SALES,
  };

  it("lets a card land only on the board pipeline's stages", () => {
    expect(
      isPipelineBoardDropAllowed({ scope, targetStageValue: 'SALES_CLOSING' }),
    ).toBe(true);
    expect(
      isPipelineBoardDropAllowed({
        scope,
        targetStageValue: 'PILOT_DISCOVERY',
      }),
    ).toBe(false);
    expect(isPipelineBoardDropAllowed({ scope, targetStageValue: null })).toBe(
      false,
    );
  });

  it('leaves boards without a pipeline unrestricted', () => {
    expect(
      isPipelineBoardDropAllowed({ scope: null, targetStageValue: 'ANY' }),
    ).toBe(true);
  });
});

describe('creating and querying from a pipeline board', () => {
  it('puts a deal created from a column in the board pipeline', () => {
    expect(
      getPipelineBoardCreateRecordDefaults({
        pipelineKey: 'PILOT_PIPELINE',
        stageValues: [],
        pipeline: PILOT,
      }),
    ).toEqual({ pipeline: 'PILOT_PIPELINE' });
    expect(getPipelineBoardCreateRecordDefaults(null)).toEqual({});
  });

  it('filters the board queries to the pipeline', () => {
    expect(
      buildPipelineBoardRecordFilter({
        pipelineKey: 'PILOT_PIPELINE',
        stageValues: [],
        pipeline: PILOT,
      }),
    ).toEqual({ pipeline: { in: ['PILOT_PIPELINE'] } });
    expect(buildPipelineBoardRecordFilter(null)).toEqual({});
  });
});

describe('buildPipelineBoardWeightedAmountByStageValue', () => {
  it('maps the weighted totals to each stage, 0 for empty stages', () => {
    expect(
      buildPipelineBoardWeightedAmountByStageValue({
        recordAggregateValueByGroupValueArray: [
          {
            recordGroupValue: 'SALES_CLOSING',
            recordAggregateValue: 4000000000,
          },
          { recordGroupValue: 'PILOT_DISCOVERY', recordAggregateValue: 10 },
        ],
        stageValues: ['SALES_DISCOVERY_STAGE', 'SALES_CLOSING'],
      }),
    ).toEqual({ SALES_DISCOVERY_STAGE: 0, SALES_CLOSING: 4000000000 });
  });
});

describe('canCreateInPipelineBoardColumn', () => {
  const scope = (rules: PipelineConfig['rules']) => ({
    pipelineKey: SALES.key,
    stageValues: SALES.stages.map(({ value }) => value),
    pipeline: { ...SALES, rules },
  });
  const limited = {
    ...SALES.rules,
    limitCreationToStages: {
      enabled: true,
      stageValues: [SALES.stages[0].value],
    },
  };

  it('hides the + on columns a new deal may not start in, for non-Admins only', () => {
    expect(
      canCreateInPipelineBoardColumn({
        scope: scope(limited),
        isAdmin: false,
        stageValue: SALES.stages[0].value,
      }),
    ).toBe(true);
    expect(
      canCreateInPipelineBoardColumn({
        scope: scope(limited),
        isAdmin: false,
        stageValue: SALES.stages[1].value,
      }),
    ).toBe(false);
    expect(
      canCreateInPipelineBoardColumn({
        scope: scope(limited),
        isAdmin: true,
        stageValue: SALES.stages[1].value,
      }),
    ).toBe(true);
  });
});
