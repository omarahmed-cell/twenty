import { isDefined } from '@/utils/validation/isDefined';

export type DealStageStatus = 'OPEN' | 'WON' | 'LOST';

export type PipelineStageListRule = {
  enabled: boolean;
  stageValues: string[];
};

// Stored from phase 1, enforced in a later phase
export type PipelineRules = {
  limitCreationToStages: PipelineStageListRule;
  restrictSkipping: boolean;
  restrictBackward: boolean;
  lockEditingInStages: PipelineStageListRule;
};

export const DEFAULT_PIPELINE_RULES: PipelineRules = {
  limitCreationToStages: { enabled: false, stageValues: [] },
  restrictSkipping: false,
  restrictBackward: false,
  lockEditingInStages: { enabled: false, stageValues: [] },
};

export const PIPELINE_STAGE_LABEL_SEPARATOR = ' › ';

const WON_PROBABILITY = 100;
const LOST_PROBABILITY = 0;

// Probability alone decides: 100 is won, 0 is lost, anything else (blank included) is open
export const getDealStageStatus = (
  probability: number | null | undefined,
): DealStageStatus => {
  if (probability === WON_PROBABILITY) {
    return 'WON';
  }

  if (probability === LOST_PROBABILITY) {
    return 'LOST';
  }

  return 'OPEN';
};

export const isClosedDealStageProbability = (
  probability: number | null | undefined,
) => getDealStageStatus(probability) !== 'OPEN';

export const normalizePipelineRules = (rules: unknown): PipelineRules => {
  const value = (
    isDefined(rules) && typeof rules === 'object' ? rules : {}
  ) as Partial<PipelineRules>;

  const toStageListRule = (
    rule: Partial<PipelineStageListRule> | undefined,
  ): PipelineStageListRule => ({
    enabled: rule?.enabled === true,
    stageValues: Array.isArray(rule?.stageValues)
      ? rule.stageValues.filter((stageValue) => typeof stageValue === 'string')
      : [],
  });

  return {
    limitCreationToStages: toStageListRule(value.limitCreationToStages),
    restrictSkipping: value.restrictSkipping === true,
    restrictBackward: value.restrictBackward === true,
    lockEditingInStages: toStageListRule(value.lockEditingInStages),
  };
};

export const countEnabledPipelineRules = (rules: unknown): number => {
  const normalizedRules = normalizePipelineRules(rules);

  return [
    normalizedRules.limitCreationToStages.enabled,
    normalizedRules.restrictSkipping,
    normalizedRules.restrictBackward,
    normalizedRules.lockEditingInStages.enabled,
  ].filter(Boolean).length;
};

// Skipping and backward rules cover every stage; the two list rules only the stages they name
export const countPipelineRulesForStage = (
  rules: unknown,
  stageValue: string,
): number => {
  const normalizedRules = normalizePipelineRules(rules);

  return [
    normalizedRules.limitCreationToStages.enabled &&
      normalizedRules.limitCreationToStages.stageValues.includes(stageValue),
    normalizedRules.restrictSkipping,
    normalizedRules.restrictBackward,
    normalizedRules.lockEditingInStages.enabled &&
      normalizedRules.lockEditingInStages.stageValues.includes(stageValue),
  ].filter(Boolean).length;
};

export const formatPipelineStageLabel = ({
  pipelineName,
  stageLabel,
}: {
  pipelineName: string | null | undefined;
  stageLabel: string;
}) =>
  isDefined(pipelineName) && pipelineName.length > 0
    ? `${pipelineName}${PIPELINE_STAGE_LABEL_SEPARATOR}${stageLabel}`
    : stageLabel;

const toUpperSnakeCase = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

const makeUnique = (candidate: string, existingValues: string[]) => {
  const taken = new Set(existingValues);

  if (!taken.has(candidate)) {
    return candidate;
  }

  let suffix = 2;

  while (taken.has(`${candidate}_${suffix}`)) {
    suffix++;
  }

  return `${candidate}_${suffix}`;
};

export const PIPELINE_KEY_SUFFIX = '_PIPELINE';

// "Sales Pipeline" -> SALES_PIPELINE, "Pilot" -> PILOT_PIPELINE; a taken key becomes SALES_2_PIPELINE
export const buildPipelineKey = (
  name: string,
  existingKeys: string[],
): string => {
  const base = toUpperSnakeCase(name.replace(/\bpipeline\b/gi, ' ')) || 'NEW';
  const taken = new Set(existingKeys);
  let candidate = `${base}${PIPELINE_KEY_SUFFIX}`;
  let suffix = 2;

  while (taken.has(candidate)) {
    candidate = `${base}_${suffix}${PIPELINE_KEY_SUFFIX}`;
    suffix++;
  }

  return candidate;
};

// The pipeline key without its suffix, then the label without its leading number: SALES + "1. Discovery Stage" -> SALES_DISCOVERY_STAGE
export const buildPipelineStageValue = ({
  pipelineKey,
  label,
  existingValues,
}: {
  pipelineKey: string;
  label: string;
  existingValues: string[];
}): string => {
  const prefix = pipelineKey.endsWith(PIPELINE_KEY_SUFFIX)
    ? pipelineKey.slice(0, -PIPELINE_KEY_SUFFIX.length)
    : pipelineKey;
  const labelPart =
    toUpperSnakeCase(label.replace(/^\s*\d+\s*[.)-]\s*/, '')) || 'STAGE';

  return makeUnique(`${prefix}_${labelPart}`, existingValues);
};

export const PIPELINE_COPY_SUFFIX = ' (copy)';
