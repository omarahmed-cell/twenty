import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import {
  getFirstStageValueOfPipeline,
  getSharedPipelineKey,
  getStageOptionsForPipeline,
  getStageOptionsWithPipelineLabels,
  movePipelineFieldBeforeStageField,
} from '@/pipeline/stage-picker/utils/getStageOptionsForPipeline';
import { DEFAULT_PIPELINE_RULES } from 'twenty-shared/utils';

const buildPipeline = (
  key: string,
  name: string,
  position: number,
  stages: { value: string; label: string }[],
): PipelineConfig => ({
  id: `${key}-id`,
  key,
  name,
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
  stages: stages.map((stage, index) => ({
    id: `${stage.value}-id`,
    pipelineId: `${key}-id`,
    position: index,
    color: null,
    probability: null,
    hubspotStageId: null,
    calcPropsEnabled: false,
    conditionalRules: [],
    ...stage,
  })),
});

const SALES = buildPipeline('SALES_PIPELINE', 'Sales Pipeline', 0, [
  { value: 'SALES_DISCOVERY_STAGE', label: '1. Discovery Stage' },
  { value: 'SALES_CLOSED_LOST', label: '8. Closed Lost' },
]);
const PILOT = buildPipeline('PILOT_PIPELINE', 'Pilot', 1, [
  { value: 'PILOT_DISCOVERY', label: 'Discovery' },
  { value: 'PILOT_CLOSED_LOST', label: 'Closed Lost' },
]);
const PIPELINES = [SALES, PILOT];

// Metadata options come back in their own order, with repeated labels
const OPTIONS = [
  { value: 'PILOT_CLOSED_LOST', label: 'Closed Lost', color: 'gray' },
  { value: 'SALES_CLOSED_LOST', label: '8. Closed Lost', color: 'red' },
  { value: 'PILOT_DISCOVERY', label: 'Discovery', color: 'gray' },
  {
    value: 'SALES_DISCOVERY_STAGE',
    label: '1. Discovery Stage',
    color: 'blue',
  },
];

describe('getStageOptionsForPipeline', () => {
  it("lists only the deal's pipeline stages, in pipeline order", () => {
    expect(
      getStageOptionsForPipeline({
        options: OPTIONS,
        pipelines: PIPELINES,
        pipelineKey: 'SALES_PIPELINE',
      }),
    ).toEqual([
      {
        value: 'SALES_DISCOVERY_STAGE',
        label: '1. Discovery Stage',
        color: 'blue',
      },
      { value: 'SALES_CLOSED_LOST', label: '8. Closed Lost', color: 'red' },
    ]);
  });

  it('reads the pipeline from the current stage when the view did not load Pipeline', () => {
    expect(
      getStageOptionsForPipeline({
        options: OPTIONS,
        pipelines: PIPELINES,
        pipelineKey: null,
        currentStageValue: 'PILOT_DISCOVERY',
      }).map(({ value }) => value),
    ).toEqual(['PILOT_DISCOVERY', 'PILOT_CLOSED_LOST']);
  });

  it('falls back to every stage under its pipeline name when the pipeline is unknown', () => {
    expect(
      getStageOptionsForPipeline({
        options: OPTIONS,
        pipelines: PIPELINES,
        pipelineKey: null,
      }).map(({ label }) => label),
    ).toEqual([
      'Sales Pipeline › 1. Discovery Stage',
      'Sales Pipeline › 8. Closed Lost',
      'Pilot › Discovery',
      'Pilot › Closed Lost',
    ]);
  });
});

describe('getStageOptionsWithPipelineLabels', () => {
  it('tells same-named stages apart and keeps their values and colors', () => {
    const labelled = getStageOptionsWithPipelineLabels({
      options: [
        ...OPTIONS,
        { value: 'LEGACY', label: 'Legacy', color: 'gray' },
      ],
      pipelines: PIPELINES,
    });

    expect(labelled[1]).toEqual({
      value: 'SALES_CLOSED_LOST',
      label: 'Sales Pipeline › 8. Closed Lost',
      color: 'red',
    });
    expect(labelled[3].label).toBe('Pilot › Closed Lost');
    expect(labelled.at(-1)).toEqual({
      value: 'LEGACY',
      label: 'Legacy',
      color: 'gray',
    });
  });
});

describe('getFirstStageValueOfPipeline', () => {
  it('moves a deal changing pipeline to that pipeline first stage', () => {
    expect(
      getFirstStageValueOfPipeline({
        pipelines: PIPELINES,
        pipelineKey: 'PILOT_PIPELINE',
      }),
    ).toBe('PILOT_DISCOVERY');
    expect(
      getFirstStageValueOfPipeline({ pipelines: PIPELINES, pipelineKey: 'X' }),
    ).toBeUndefined();
  });
});

describe('getSharedPipelineKey', () => {
  it('allows setting a stage when every selected deal is in the same pipeline', () => {
    expect(
      getSharedPipelineKey(['SALES_PIPELINE', 'SALES_PIPELINE', null]),
    ).toEqual({ status: 'shared', pipelineKey: 'SALES_PIPELINE' });
  });

  it('blocks it when the selected deals are in different pipelines', () => {
    expect(getSharedPipelineKey(['SALES_PIPELINE', 'PILOT_PIPELINE'])).toEqual({
      status: 'mixed',
    });
  });

  it('reports no pipeline for an empty selection', () => {
    expect(getSharedPipelineKey([])).toEqual({ status: 'none' });
  });
});

describe('movePipelineFieldBeforeStageField', () => {
  it('puts Pipeline right before Stage so it is picked first', () => {
    expect(
      movePipelineFieldBeforeStageField([
        { name: 'name' },
        { name: 'stage' },
        { name: 'amount' },
        { name: 'pipeline' },
      ]).map(({ name }) => name),
    ).toEqual(['name', 'pipeline', 'stage', 'amount']);
  });

  it('leaves other forms alone', () => {
    const fields = [{ name: 'name' }, { name: 'stage' }];

    expect(movePipelineFieldBeforeStageField(fields)).toBe(fields);
  });
});
