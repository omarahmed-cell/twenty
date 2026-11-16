import {
  type DealStageMoveRefusal,
  evaluateDealStageMove,
  isDealCreationStageAllowed,
  isDealStageLocked,
  isDefined,
  normalizePipelineRules,
} from 'twenty-shared/utils';

import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';

export type DealRuleActorKind =
  | 'ADMIN'
  | 'MEMBER'
  | 'WORKFLOW'
  | 'IMPORT'
  | 'SYSTEM';

export type DealRuleViolation =
  | { kind: 'STAGE_MOVE'; refusal: DealStageMoveRefusal }
  | {
      kind: 'CREATION_STAGE';
      pipelineName: string;
      stageLabel: string;
      allowedLabels: string[];
    }
  | {
      kind: 'PIPELINE_CHANGE';
      pipelineName: string;
      stageLabel: string;
    }
  | { kind: 'LOCKED'; stageLabel: string; isDelete: boolean }
  | { kind: 'CLOSE_DATE' };

export type DealRuleEvaluation =
  | { status: 'allowed' }
  | { status: 'refused'; violation: DealRuleViolation }
  | { status: 'overridden'; violations: DealRuleViolation[] };

type DealValues = {
  pipeline: string | null;
  stage: string | null;
  closeDate?: string | Date | null;
};

const stageLabelOf = (
  pipeline: PipelineConfig | undefined,
  value: string | null,
) =>
  pipeline?.stages.find((stage) => stage.value === value)?.label ?? value ?? '';

const toInstant = (value: string | Date | null | undefined) =>
  isDefined(value) ? new Date(value).getTime() : null;

// Admins bypass every rule but leave a trace; workflows, imports and the server itself bypass silently
export const evaluateDealPipelineRules = ({
  operation,
  actorKind,
  pipelines,
  current,
  next,
  changedFieldNames = [],
}: {
  operation: 'create' | 'update' | 'delete';
  actorKind: DealRuleActorKind;
  pipelines: PipelineConfig[];
  current?: DealValues;
  next?: DealValues;
  changedFieldNames?: string[];
}): DealRuleEvaluation => {
  if (
    actorKind === 'WORKFLOW' ||
    actorKind === 'IMPORT' ||
    actorKind === 'SYSTEM'
  ) {
    return { status: 'allowed' };
  }

  const pipelineByKey = new Map(
    pipelines.map((pipeline) => [pipeline.key, pipeline]),
  );
  const violations: DealRuleViolation[] = [];

  if (operation === 'create' && isDefined(next?.stage)) {
    const pipeline = isDefined(next.pipeline)
      ? pipelineByKey.get(next.pipeline)
      : undefined;

    if (
      isDefined(pipeline) &&
      !isDealCreationStageAllowed({
        rules: pipeline.rules,
        stageValue: next.stage,
      })
    ) {
      violations.push({
        kind: 'CREATION_STAGE',
        pipelineName: pipeline.name,
        stageLabel: stageLabelOf(pipeline, next.stage),
        allowedLabels: normalizePipelineRules(
          pipeline.rules,
        ).limitCreationToStages.stageValues.map((value) =>
          stageLabelOf(pipeline, value),
        ),
      });
    }
  }

  if (
    (operation === 'update' || operation === 'delete') &&
    isDefined(current)
  ) {
    const currentPipeline = isDefined(current.pipeline)
      ? pipelineByKey.get(current.pipeline)
      : undefined;

    if (
      isDefined(currentPipeline) &&
      (operation === 'delete' || changedFieldNames.length > 0) &&
      isDealStageLocked({
        rules: currentPipeline.rules,
        stageValue: current.stage,
      })
    ) {
      violations.push({
        kind: 'LOCKED',
        stageLabel: stageLabelOf(currentPipeline, current.stage),
        isDelete: operation === 'delete',
      });
    }

    if (
      operation === 'update' &&
      isDefined(next) &&
      next.closeDate !== undefined &&
      toInstant(next.closeDate) !== toInstant(current.closeDate)
    ) {
      violations.push({ kind: 'CLOSE_DATE' });
    }

    if (operation === 'update' && isDefined(next)) {
      const isPipelineChange =
        isDefined(next.pipeline) && next.pipeline !== current.pipeline;

      if (isPipelineChange) {
        const targetPipeline = pipelineByKey.get(next.pipeline as string);

        if (
          isDefined(targetPipeline) &&
          isDefined(next.stage) &&
          !isDealCreationStageAllowed({
            rules: targetPipeline.rules,
            stageValue: next.stage,
          })
        ) {
          violations.push({
            kind: 'PIPELINE_CHANGE',
            pipelineName: targetPipeline.name,
            stageLabel: stageLabelOf(targetPipeline, next.stage),
          });
        }
      } else if (
        isDefined(currentPipeline) &&
        isDefined(next.stage) &&
        next.stage !== current.stage
      ) {
        const refusal = evaluateDealStageMove({
          stages: currentPipeline.stages,
          rules: currentPipeline.rules,
          fromStageValue: current.stage,
          toStageValue: next.stage,
        });

        if (isDefined(refusal)) {
          violations.push({ kind: 'STAGE_MOVE', refusal });
        }
      }
    }
  }

  if (violations.length === 0) {
    return { status: 'allowed' };
  }

  return actorKind === 'ADMIN'
    ? { status: 'overridden', violations }
    : { status: 'refused', violation: violations[0] };
};

export const describeDealRuleOverride = ({
  violation,
  actorName,
}: {
  violation: DealRuleViolation;
  actorName: string;
}): string => {
  const by = `by ${actorName} (Super Admin override)`;

  switch (violation.kind) {
    case 'STAGE_MOVE': {
      const { refusal } = violation;

      switch (refusal.reason) {
        case 'BACKWARD':
          return `Moved backward from ${refusal.fromLabel} to ${refusal.toLabel} ${by}`;
        case 'OUT_OF_CLOSED_STAGE':
          return `Moved out of ${refusal.fromLabel} to ${refusal.toLabel} ${by}`;
        case 'SKIP':
          return `Skipped from ${refusal.fromLabel} to ${refusal.toLabel} ${by}`;
      }
    }
    case 'CREATION_STAGE':
      return `Created in ${violation.stageLabel}, outside the allowed creation stages, ${by}`;
    case 'PIPELINE_CHANGE':
      return `Moved into the ${violation.pipelineName} pipeline at ${violation.stageLabel} ${by}`;
    case 'LOCKED':
      return violation.isDelete
        ? `Deleted while in ${violation.stageLabel} (locked stage) ${by}`
        : `Edited while in ${violation.stageLabel} (locked stage) ${by}`;
    case 'CLOSE_DATE':
      return `Changed Close Date ${by}`;
  }
};
