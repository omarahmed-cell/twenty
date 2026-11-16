import { PIPELINE_SEED } from '@/constants/PipelineSeed';
import {
  buildPipelineKey,
  buildPipelineStageValue,
  countEnabledPipelineRules,
  countPipelineRulesForStage,
  DEFAULT_PIPELINE_RULES,
  formatPipelineStageLabel,
  getDealStageStatus,
  normalizePipelineRules,
} from '@/utils/pipeline/pipeline-config';

describe('getDealStageStatus', () => {
  it('reads won, lost and open from the probability alone', () => {
    expect(getDealStageStatus(100)).toBe('WON');
    expect(getDealStageStatus(0)).toBe('LOST');
    expect(getDealStageStatus(40)).toBe('OPEN');
    expect(getDealStageStatus(99)).toBe('OPEN');
  });

  it('treats a blank probability as open', () => {
    expect(getDealStageStatus(null)).toBe('OPEN');
    expect(getDealStageStatus(undefined)).toBe('OPEN');
  });
});

describe('stage keys', () => {
  it('builds the seeded keys from the pipeline key and the stage label', () => {
    for (const pipeline of PIPELINE_SEED) {
      expect(buildPipelineKey(pipeline.name, [])).toBe(pipeline.key);

      for (const stage of pipeline.stages) {
        expect(
          buildPipelineStageValue({
            pipelineKey: pipeline.key,
            label: stage.label,
            existingValues: [],
          }),
        ).toBe(stage.value);
      }
    }
  });

  it('keeps every seeded stage value unique across pipelines', () => {
    const values = PIPELINE_SEED.flatMap(({ stages }) =>
      stages.map(({ value }) => value),
    );

    expect(new Set(values).size).toBe(values.length);
  });

  it('suffixes a key that is already taken', () => {
    expect(buildPipelineKey('Sales Pipeline', ['SALES_PIPELINE'])).toBe(
      'SALES_2_PIPELINE',
    );
    expect(
      buildPipelineStageValue({
        pipelineKey: 'SALES_PIPELINE',
        label: 'New stage',
        existingValues: ['SALES_NEW_STAGE', 'SALES_NEW_STAGE_2'],
      }),
    ).toBe('SALES_NEW_STAGE_3');
  });

  it('names a copied pipeline without repeating the suffix', () => {
    expect(buildPipelineKey('Sales Pipeline (copy)', ['SALES_PIPELINE'])).toBe(
      'SALES_COPY_PIPELINE',
    );
  });
});

describe('pipeline rules', () => {
  it('stores every rule off by default', () => {
    expect(normalizePipelineRules(null)).toEqual(DEFAULT_PIPELINE_RULES);
    expect(countEnabledPipelineRules(DEFAULT_PIPELINE_RULES)).toBe(0);
  });

  it('counts the rules that are on, and those that apply to a stage', () => {
    const rules = {
      limitCreationToStages: { enabled: true, stageValues: ['SALES_CLOSING'] },
      restrictSkipping: true,
      restrictBackward: false,
      lockEditingInStages: { enabled: false, stageValues: ['SALES_CLOSING'] },
    };

    expect(countEnabledPipelineRules(rules)).toBe(2);
    expect(countPipelineRulesForStage(rules, 'SALES_CLOSING')).toBe(2);
    expect(countPipelineRulesForStage(rules, 'SALES_SIGNED')).toBe(1);
  });
});

describe('formatPipelineStageLabel', () => {
  it('prefixes the stage with its pipeline so same-named stages differ', () => {
    expect(
      formatPipelineStageLabel({
        pipelineName: 'Sales Pipeline',
        stageLabel: '8. Closed Lost',
      }),
    ).toBe('Sales Pipeline › 8. Closed Lost');
  });
});
