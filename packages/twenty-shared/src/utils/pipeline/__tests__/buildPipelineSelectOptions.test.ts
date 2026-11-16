import { buildPipelineSelectOptions } from '@/utils/pipeline/buildPipelineSelectOptions';

const FIELDS = {
  pipelineFieldUniversalIdentifier: '11111111-1111-4111-8111-111111111111',
  stageFieldUniversalIdentifier: '22222222-2222-4222-8222-222222222222',
};

const SALES = {
  key: 'SALES_PIPELINE',
  name: 'Sales Pipeline',
  stages: [
    {
      value: 'SALES_DISCOVERY_STAGE',
      label: '1. Discovery Stage',
      color: null,
    },
    { value: 'SALES_CLOSED_LOST', label: '8. Closed Lost', color: 'red' },
  ],
};

const PILOT = {
  key: 'PILOT_PIPELINE',
  name: 'Pilot',
  stages: [{ value: 'PILOT_CLOSED_LOST', label: 'Closed Lost', color: null }],
};

describe('buildPipelineSelectOptions', () => {
  it('lists every pipeline and every stage in Settings order', () => {
    const result = buildPipelineSelectOptions({
      ...FIELDS,
      pipelines: [SALES, PILOT],
    });

    expect(result.pipelineOptions.map(({ value }) => value)).toEqual([
      'SALES_PIPELINE',
      'PILOT_PIPELINE',
    ]);
    expect(
      result.stageOptions.map(({ value, position }) => [value, position]),
    ).toEqual([
      ['SALES_DISCOVERY_STAGE', 0],
      ['SALES_CLOSED_LOST', 1],
      ['PILOT_CLOSED_LOST', 2],
    ]);
    expect(result.stageOptions[0].color).toBe('gray');
    expect(result.defaultPipelineValue).toBe('SALES_PIPELINE');
    expect(result.defaultStageValue).toBe('SALES_DISCOVERY_STAGE');
  });

  it('keeps the option id and value when a stage is renamed', () => {
    const first = buildPipelineSelectOptions({ ...FIELDS, pipelines: [SALES] });
    const renamed = buildPipelineSelectOptions({
      ...FIELDS,
      pipelines: [
        {
          ...SALES,
          stages: [{ ...SALES.stages[0], label: 'Discovery' }, SALES.stages[1]],
        },
      ],
      existingStageOptions: first.stageOptions,
    });

    expect(renamed.stageOptions[0]).toEqual({
      ...first.stageOptions[0],
      label: 'Discovery',
    });
  });

  it('follows a reorder of stages and of pipelines', () => {
    const result = buildPipelineSelectOptions({
      ...FIELDS,
      pipelines: [
        PILOT,
        { ...SALES, stages: [SALES.stages[1], SALES.stages[0]] },
      ],
    });

    expect(result.stageOptions.map(({ value }) => value)).toEqual([
      'PILOT_CLOSED_LOST',
      'SALES_CLOSED_LOST',
      'SALES_DISCOVERY_STAGE',
    ]);
    expect(result.defaultStageValue).toBe('PILOT_CLOSED_LOST');
  });

  it('adds an option for a new stage and drops the option of a deleted one', () => {
    const first = buildPipelineSelectOptions({ ...FIELDS, pipelines: [SALES] });
    const result = buildPipelineSelectOptions({
      ...FIELDS,
      pipelines: [
        {
          ...SALES,
          stages: [
            SALES.stages[0],
            { value: 'SALES_NEW_STAGE', label: 'New stage', color: null },
          ],
        },
      ],
      existingStageOptions: first.stageOptions,
    });

    expect(result.stageOptions.map(({ value }) => value)).toEqual([
      'SALES_DISCOVERY_STAGE',
      'SALES_NEW_STAGE',
    ]);
    expect(result.stageOptions[0].id).toBe(first.stageOptions[0].id);
    expect(new Set(result.stageOptions.map(({ id }) => id)).size).toBe(2);
  });

  it('has no defaults without a pipeline that has stages', () => {
    const result = buildPipelineSelectOptions({ ...FIELDS, pipelines: [] });

    expect(result.defaultPipelineValue).toBeNull();
    expect(result.defaultStageValue).toBeNull();
  });
});
