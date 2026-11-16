import { useMemo } from 'react';

import { useDealStagePipelineConfigs } from '@/pipeline/stage-picker/hooks/useDealStagePipelineConfigs';
import {
  getStageOptionsForPipeline,
  getStageOptionsWithPipelineLabels,
} from '@/pipeline/stage-picker/utils/getStageOptionsForPipeline';

type StageOption = { value: string; label: string };

export type DealStageOptionsScope =
  | {
      type: 'pipeline';
      pipelineKey: string | null | undefined;
      currentStageValue?: string | null;
    }
  | { type: 'all' };

// Leaves options untouched unless the field is the Deal Stage
export const useDealStageOptions = <TOption extends StageOption>({
  isDealStage,
  options,
  scope,
}: {
  isDealStage: boolean;
  options: TOption[];
  scope: DealStageOptionsScope;
}): TOption[] => {
  const pipelines = useDealStagePipelineConfigs({ enabled: isDealStage });

  const pipelineKey = scope.type === 'pipeline' ? scope.pipelineKey : null;
  const currentStageValue =
    scope.type === 'pipeline' ? scope.currentStageValue : null;

  return useMemo(() => {
    if (!isDealStage || pipelines.length === 0) {
      return options;
    }

    return scope.type === 'pipeline'
      ? getStageOptionsForPipeline({
          options,
          pipelines,
          pipelineKey,
          currentStageValue,
        })
      : getStageOptionsWithPipelineLabels({ options, pipelines });
  }, [
    isDealStage,
    options,
    pipelines,
    scope.type,
    pipelineKey,
    currentStageValue,
  ]);
};
