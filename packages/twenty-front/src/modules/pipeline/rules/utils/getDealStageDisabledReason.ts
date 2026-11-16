import { t } from '@lingui/core/macro';
import {
  evaluateDealStageMove,
  isDealCreationStageAllowed,
  isDealStageLocked,
  isDefined,
} from 'twenty-shared/utils';

import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';

// Mirrors the server rules so reps aren't offered what the server would refuse; Admins are never limited
export const getDealStageDisabledReason = ({
  pipeline,
  isAdmin,
  isCreate,
  currentStageValue,
  targetStageValue,
}: {
  pipeline: PipelineConfig | undefined;
  isAdmin: boolean;
  isCreate: boolean;
  currentStageValue: string | null | undefined;
  targetStageValue: string;
}): string | null => {
  if (isAdmin || !isDefined(pipeline)) {
    return null;
  }

  if (isCreate) {
    return isDealCreationStageAllowed({
      rules: pipeline.rules,
      stageValue: targetStageValue,
    })
      ? null
      : t`New deals in this pipeline can't start in this stage`;
  }

  if (
    isDealStageLocked({ rules: pipeline.rules, stageValue: currentStageValue })
  ) {
    const currentLabel =
      pipeline.stages.find(({ value }) => value === currentStageValue)?.label ??
      '';

    return targetStageValue === currentStageValue
      ? null
      : t`Deals in ${currentLabel} can only be edited by Super Admins`;
  }

  const refusal = evaluateDealStageMove({
    stages: pipeline.stages,
    rules: pipeline.rules,
    fromStageValue: currentStageValue,
    toStageValue: targetStageValue,
  });

  if (!isDefined(refusal)) {
    return null;
  }

  const { fromLabel, toLabel } = refusal;

  switch (refusal.reason) {
    case 'SKIP': {
      const nextAllowedLabel = refusal.nextAllowedLabel ?? '';

      return t`Can't skip from ${fromLabel} to ${toLabel}. Next allowed: ${nextAllowedLabel}, or a lost stage`;
    }
    case 'BACKWARD':
      return t`Can't move backward from ${fromLabel}. Only Super Admins can`;
    case 'OUT_OF_CLOSED_STAGE':
      return t`Deals in ${fromLabel} can't change stage. Only Super Admins can`;
  }
};

export const isDealLockedForViewer = ({
  pipeline,
  isAdmin,
  stageValue,
}: {
  pipeline: PipelineConfig | undefined;
  isAdmin: boolean;
  stageValue: string | null | undefined;
}) =>
  !isAdmin &&
  isDefined(pipeline) &&
  isDealStageLocked({ rules: pipeline.rules, stageValue });
