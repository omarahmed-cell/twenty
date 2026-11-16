import {
  type ConditionalLogicField,
  findMissingConditionalLogicProperties,
  isDefined,
  normalizeConditionalLogicRules,
} from 'twenty-shared/utils';

import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';
import { type DealRuleActorKind } from 'src/modules/pipeline/utils/evaluate-deal-pipeline-rules.util';

export type DealStageEntryViolation = {
  operation: 'create' | 'update';
  stageLabel: string;
  missingFieldLabels: string[];
};

type DealStageValues = { pipeline: string | null; stage: string | null };

export const findEnteredDealStage = ({
  operation,
  pipelines,
  current,
  next,
}: {
  operation: 'create' | 'update';
  pipelines: PipelineConfig[];
  current?: DealStageValues;
  next: DealStageValues;
}) => {
  const isEntering =
    isDefined(next.stage) &&
    (operation === 'create' || next.stage !== current?.stage);

  if (!isEntering) {
    return undefined;
  }

  const stage = pipelines
    .filter(({ key }) => !isDefined(next.pipeline) || key === next.pipeline)
    .flatMap(({ stages }) => stages)
    .find(({ value }) => value === next.stage);

  if (!isDefined(stage)) {
    return undefined;
  }

  const rules = normalizeConditionalLogicRules(stage.conditionalRules);

  return rules.length > 0 ? { stage, rules } : undefined;
};

// Required-to-enter rules bind Admins too; only automation (workflows, imports, the server) skips them
export const evaluateDealStageEntry = ({
  operation,
  actorKind,
  pipelines,
  current,
  next,
  record,
  fields,
}: {
  operation: 'create' | 'update';
  actorKind: DealRuleActorKind;
  pipelines: PipelineConfig[];
  current?: DealStageValues;
  next: DealStageValues;
  record: Record<string, unknown>;
  fields: ConditionalLogicField[];
}): DealStageEntryViolation | null => {
  if (actorKind !== 'ADMIN' && actorKind !== 'MEMBER') {
    return null;
  }

  const entered = findEnteredDealStage({ operation, pipelines, current, next });

  if (!isDefined(entered)) {
    return null;
  }

  const missing = findMissingConditionalLogicProperties({
    rules: entered.rules,
    record,
    fields,
  });

  return missing.length > 0
    ? {
        operation,
        stageLabel: entered.stage.label,
        missingFieldLabels: missing.map(({ label }) => label),
      }
    : null;
};
