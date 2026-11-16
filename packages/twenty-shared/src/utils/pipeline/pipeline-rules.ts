import { isDefined } from '@/utils/validation/isDefined';
import {
  getDealStageStatus,
  normalizePipelineRules,
} from '@/utils/pipeline/pipeline-config';

export type PipelineRuleStage = {
  value: string;
  label: string;
  position: number;
  probability: number | null;
};

export type DealStageMoveRefusal =
  | { reason: 'BACKWARD'; fromLabel: string; toLabel: string }
  | { reason: 'OUT_OF_CLOSED_STAGE'; fromLabel: string; toLabel: string }
  | {
      reason: 'SKIP';
      fromLabel: string;
      toLabel: string;
      nextAllowedLabel: string | null;
    };

const orderStages = (stages: PipelineRuleStage[]) =>
  [...stages].sort((first, second) => first.position - second.position);

const isClosedStage = (stage: PipelineRuleStage) =>
  getDealStageStatus(stage.probability) !== 'OPEN';

const isLostStage = (stage: PipelineRuleStage) =>
  getDealStageStatus(stage.probability) === 'LOST';

// Skipping only forbids jumping ahead from an open stage; any lost stage stays reachable
export const evaluateDealStageMove = ({
  stages,
  rules,
  fromStageValue,
  toStageValue,
}: {
  stages: PipelineRuleStage[];
  rules: unknown;
  fromStageValue: string | null | undefined;
  toStageValue: string;
}): DealStageMoveRefusal | null => {
  if (!isDefined(fromStageValue) || fromStageValue === toStageValue) {
    return null;
  }

  const ordered = orderStages(stages);
  const fromIndex = ordered.findIndex(({ value }) => value === fromStageValue);
  const toIndex = ordered.findIndex(({ value }) => value === toStageValue);
  const from = ordered[fromIndex];
  const to = ordered[toIndex];

  if (!isDefined(from) || !isDefined(to)) {
    return null;
  }
  const { restrictBackward, restrictSkipping } = normalizePipelineRules(rules);

  if (restrictBackward && isClosedStage(from)) {
    return {
      reason: 'OUT_OF_CLOSED_STAGE',
      fromLabel: from.label,
      toLabel: to.label,
    };
  }

  if (restrictBackward && toIndex < fromIndex) {
    return { reason: 'BACKWARD', fromLabel: from.label, toLabel: to.label };
  }

  if (
    restrictSkipping &&
    !isClosedStage(from) &&
    toIndex > fromIndex + 1 &&
    !isLostStage(to)
  ) {
    return {
      reason: 'SKIP',
      fromLabel: from.label,
      toLabel: to.label,
      nextAllowedLabel: ordered[fromIndex + 1]?.label ?? null,
    };
  }

  return null;
};

export const isDealCreationStageAllowed = ({
  rules,
  stageValue,
}: {
  rules: unknown;
  stageValue: string;
}) => {
  const { limitCreationToStages } = normalizePipelineRules(rules);

  return (
    !limitCreationToStages.enabled ||
    limitCreationToStages.stageValues.includes(stageValue)
  );
};

export const isDealStageLocked = ({
  rules,
  stageValue,
}: {
  rules: unknown;
  stageValue: string | null | undefined;
}) => {
  const { lockEditingInStages } = normalizePipelineRules(rules);

  return (
    isDefined(stageValue) &&
    lockEditingInStages.enabled &&
    lockEditingInStages.stageValues.includes(stageValue)
  );
};
