import {
  applyDealStageRulesToOptions,
  findDealPipeline,
  getDealCreationStageFallback,
  getFirstAllowedCreationStageValue,
} from '@/pipeline/rules/utils/applyDealStageRules';
import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';

const buildPipeline = (
  key: string,
  stageValues: string[],
  rules: PipelineConfig['rules'],
): PipelineConfig => ({
  id: key,
  key,
  name: key,
  description: null,
  position: 0,
  objectNameSingular: 'opportunity',
  rules,
  stages: stageValues.map((value, position) => ({
    id: value,
    pipelineId: key,
    value,
    label: `Stage ${value}`,
    position,
    probability: null,
    color: null,
    hubspotStageId: null,
    calcPropsEnabled: false,
  })),
});

const SALES = buildPipeline('SALES', ['A', 'B', 'C', 'WON'], {
  limitCreationToStages: { enabled: true, stageValues: ['B'] },
  restrictSkipping: true,
  restrictBackward: true,
  lockEditingInStages: { enabled: true, stageValues: ['WON'] },
});

const PILOT = buildPipeline('PILOT', ['P1', 'P2'], {
  limitCreationToStages: { enabled: false, stageValues: [] },
  restrictSkipping: false,
  restrictBackward: false,
  lockEditingInStages: { enabled: false, stageValues: [] },
});

type StageOption = {
  value: string;
  label: string;
  disabled?: boolean;
  contextualText?: string;
};

const OPTIONS: StageOption[] = ['A', 'B', 'C', 'WON'].map((value) => ({
  value,
  label: value,
}));

describe('findDealPipeline', () => {
  it('finds the pipeline by key, else by the stage it holds', () => {
    const pipelines = [SALES, PILOT];

    expect(
      findDealPipeline({ pipelines, pipelineKey: 'PILOT', stageValue: 'A' }),
    ).toBe(PILOT);
    expect(
      findDealPipeline({ pipelines, pipelineKey: null, stageValue: 'C' }),
    ).toBe(SALES);
    expect(
      findDealPipeline({ pipelines, pipelineKey: null, stageValue: null }),
    ).toBeUndefined();
  });
});

describe('applyDealStageRulesToOptions', () => {
  it('greys out refused moves with their reason and keeps allowed ones', () => {
    const options = applyDealStageRulesToOptions({
      options: OPTIONS,
      pipeline: SALES,
      isAdmin: false,
      isCreate: false,
      currentStageValue: 'A',
    });

    expect(options.map(({ value, disabled }) => [value, disabled])).toEqual([
      ['A', undefined],
      ['B', undefined],
      ['C', true],
      ['WON', true],
    ]);
    expect(options[2].contextualText).toContain("Can't skip");
  });

  it('offers only the creation stages on a new deal', () => {
    const options = applyDealStageRulesToOptions({
      options: OPTIONS,
      pipeline: SALES,
      isAdmin: false,
      isCreate: true,
      currentStageValue: null,
    });

    expect(
      options
        .filter(({ disabled }) => disabled !== true)
        .map(({ value }) => value),
    ).toEqual(['B']);
  });

  it('leaves every option open to an Admin', () => {
    expect(
      applyDealStageRulesToOptions({
        options: OPTIONS,
        pipeline: SALES,
        isAdmin: true,
        isCreate: true,
        currentStageValue: null,
      }),
    ).toEqual(OPTIONS);
  });
});

describe('getFirstAllowedCreationStageValue', () => {
  it('returns the first stage a new deal may start in', () => {
    expect(
      getFirstAllowedCreationStageValue({ pipeline: SALES, isAdmin: false }),
    ).toBe('B');
    expect(
      getFirstAllowedCreationStageValue({ pipeline: SALES, isAdmin: true }),
    ).toBe('A');
    expect(
      getFirstAllowedCreationStageValue({ pipeline: PILOT, isAdmin: false }),
    ).toBe('P1');
  });
});

describe('getDealCreationStageFallback', () => {
  it('swaps a missing, foreign or refused draft stage for an allowed one', () => {
    const fallback = (draftStageValue: string | null, isAdmin = false) =>
      getDealCreationStageFallback({
        pipeline: SALES,
        isAdmin,
        draftStageValue,
      });

    expect(fallback(null)).toBe('B');
    expect(fallback('A')).toBe('B');
    expect(fallback('P1')).toBe('B');
    expect(fallback('B')).toBeUndefined();
    expect(fallback('A', true)).toBeUndefined();
  });
});
