import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import { computeReorderedPositions } from '@/settings/data-model/pipelines/utils/computeReorderedPositions';
import { filterPipelinesBySearch } from '@/settings/data-model/pipelines/utils/filterPipelinesBySearch';
import { formatPipelineStageProbability } from '@/settings/data-model/pipelines/utils/formatPipelineStageProbability';
import { getDealsInUseBlockedMessage } from '@/settings/data-model/pipelines/utils/getDealsInUseBlockedMessage';
import { getNextPipelinePosition } from '@/settings/data-model/pipelines/utils/getNextPipelinePosition';
import { getSettingsPipelinePath } from '@/settings/data-model/pipelines/utils/getSettingsPipelinePath';
import { parsePipelineStageProbabilityInput } from '@/settings/data-model/pipelines/utils/parsePipelineStageProbabilityInput';
import {
  keepExistingRuleStages,
  setPipelineRuleEnabled,
  togglePipelineRuleStage,
} from '@/settings/data-model/pipelines/utils/updatePipelineRules';
import { DEFAULT_PIPELINE_RULES } from 'twenty-shared/utils';

const buildPipeline = (name: string): PipelineConfig => ({
  id: name,
  key: name.toUpperCase(),
  name,
  description: null,
  position: 0,
  objectNameSingular: 'opportunity',
  rules: DEFAULT_PIPELINE_RULES,
  stages: [],
});

describe('formatPipelineStageProbability', () => {
  it('labels 100 as won and 0 as lost', () => {
    expect(formatPipelineStageProbability(100)).toBe('100% (Won)');
    expect(formatPipelineStageProbability(0)).toBe('0% (Lost)');
  });

  it('shows an open probability as a plain percentage and a blank one as a dash', () => {
    expect(formatPipelineStageProbability(40)).toBe('40%');
    expect(formatPipelineStageProbability(null)).toBe('—');
  });
});

describe('parsePipelineStageProbabilityInput', () => {
  it('accepts whole numbers from 0 to 100, with or without a percent sign', () => {
    expect(parsePipelineStageProbabilityInput('40')).toEqual({
      isValid: true,
      probability: 40,
    });
    expect(parsePipelineStageProbabilityInput(' 100% ')).toEqual({
      isValid: true,
      probability: 100,
    });
    expect(parsePipelineStageProbabilityInput('0')).toEqual({
      isValid: true,
      probability: 0,
    });
  });

  it('clears the probability on an empty input', () => {
    expect(parsePipelineStageProbabilityInput('  ')).toEqual({
      isValid: true,
      probability: null,
    });
  });

  it('refuses values outside 0 to 100 and non numbers', () => {
    expect(parsePipelineStageProbabilityInput('101').isValid).toBe(false);
    expect(parsePipelineStageProbabilityInput('-5').isValid).toBe(false);
    expect(parsePipelineStageProbabilityInput('12.5').isValid).toBe(false);
    expect(parsePipelineStageProbabilityInput('abc').isValid).toBe(false);
  });
});

describe('getDealsInUseBlockedMessage', () => {
  it('allows deleting when no deal uses it', () => {
    expect(
      getDealsInUseBlockedMessage({ dealCount: 0, kind: 'pipeline' }),
    ).toBeNull();
  });

  it('blocks with the number of deals', () => {
    expect(
      getDealsInUseBlockedMessage({ dealCount: 3, kind: 'pipeline' }),
    ).toBe('3 deals use this pipeline. Move them to another pipeline first.');
    expect(getDealsInUseBlockedMessage({ dealCount: 1, kind: 'stage' })).toBe(
      '1 deal is in this stage. Move it to another stage first.',
    );
  });

  it('blocks while the count is still loading', () => {
    expect(
      getDealsInUseBlockedMessage({ dealCount: undefined, kind: 'stage' }),
    ).toBe('Counting deals…');
  });
});

describe('computeReorderedPositions', () => {
  it('renumbers by index and returns only the moved items', () => {
    expect(
      computeReorderedPositions({
        items: [
          { id: 'a', position: 0 },
          { id: 'b', position: 1 },
          { id: 'c', position: 2 },
        ],
        fromIndex: 2,
        toIndex: 0,
      }),
    ).toEqual([
      { id: 'c', position: 0 },
      { id: 'a', position: 1 },
      { id: 'b', position: 2 },
    ]);

    expect(
      computeReorderedPositions({
        items: [
          { id: 'a', position: 0 },
          { id: 'b', position: 1 },
          { id: 'c', position: 2 },
        ],
        fromIndex: 1,
        toIndex: 2,
      }),
    ).toEqual([
      { id: 'c', position: 1 },
      { id: 'b', position: 2 },
    ]);
  });
});

describe('getNextPipelinePosition', () => {
  it('places a new item after the last one', () => {
    expect(getNextPipelinePosition([])).toBe(0);
    expect(getNextPipelinePosition([{ position: 3 }, { position: 1 }])).toBe(4);
  });
});

describe('filterPipelinesBySearch', () => {
  it('matches pipeline names regardless of case', () => {
    const pipelines = [buildPipeline('Sales Pipeline'), buildPipeline('Pilot')];

    expect(
      filterPipelinesBySearch(pipelines, 'sales').map(({ name }) => name),
    ).toEqual(['Sales Pipeline']);
    expect(filterPipelinesBySearch(pipelines, '')).toHaveLength(2);
  });
});

describe('pipeline rules editing', () => {
  it('turns rules on and adds or removes their stages', () => {
    const withLimit = setPipelineRuleEnabled({
      rules: DEFAULT_PIPELINE_RULES,
      ruleKey: 'limitCreationToStages',
      enabled: true,
    });
    const withStage = togglePipelineRuleStage({
      rules: withLimit,
      ruleKey: 'limitCreationToStages',
      stageValue: 'SALES_CLOSING',
    });

    expect(withStage.limitCreationToStages).toEqual({
      enabled: true,
      stageValues: ['SALES_CLOSING'],
    });
    expect(
      togglePipelineRuleStage({
        rules: withStage,
        ruleKey: 'limitCreationToStages',
        stageValue: 'SALES_CLOSING',
      }).limitCreationToStages.stageValues,
    ).toEqual([]);
    expect(
      setPipelineRuleEnabled({
        rules: DEFAULT_PIPELINE_RULES,
        ruleKey: 'restrictBackward',
        enabled: true,
      }).restrictBackward,
    ).toBe(true);
  });

  it('drops stages that no longer exist', () => {
    expect(
      keepExistingRuleStages({
        rules: {
          ...DEFAULT_PIPELINE_RULES,
          lockEditingInStages: {
            enabled: true,
            stageValues: ['SALES_SIGNED', 'SALES_GONE'],
          },
        },
        stageValues: ['SALES_SIGNED'],
      }).lockEditingInStages.stageValues,
    ).toEqual(['SALES_SIGNED']);
  });
});

describe('getSettingsPipelinePath', () => {
  it('builds the pipeline page and new pipeline paths', () => {
    expect(
      getSettingsPipelinePath({
        objectNamePlural: 'opportunities',
        pipelineId: 'p1',
      }),
    ).toBe('/settings/objects/opportunities/pipelines/p1');
    expect(getSettingsPipelinePath({ objectNamePlural: 'opportunities' })).toBe(
      '/settings/objects/opportunities/pipelines/new',
    );
  });
});
