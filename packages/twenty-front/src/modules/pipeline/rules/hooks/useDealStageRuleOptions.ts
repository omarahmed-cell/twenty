import { useMemo } from 'react';

import { useIsPipelineAdmin } from '@/pipeline/rules/hooks/useIsPipelineAdmin';
import {
  applyDealStageRulesToOptions,
  findDealPipeline,
} from '@/pipeline/rules/utils/applyDealStageRules';
import { useDealStagePipelineConfigs } from '@/pipeline/stage-picker/hooks/useDealStagePipelineConfigs';

type StageOption = {
  value: string;
  disabled?: boolean;
  contextualText?: string;
};

export const useDealStageRuleOptions = <TOption extends StageOption>({
  isDealStage,
  options,
  pipelineKey,
  currentStageValue,
  isCreate,
}: {
  isDealStage: boolean;
  options: TOption[];
  pipelineKey: string | null | undefined;
  currentStageValue: string | null | undefined;
  isCreate: boolean;
}): TOption[] => {
  const isAdmin = useIsPipelineAdmin({ skip: !isDealStage });
  const pipelines = useDealStagePipelineConfigs({ enabled: isDealStage });

  return useMemo(() => {
    if (!isDealStage || isAdmin) {
      return options;
    }

    return applyDealStageRulesToOptions({
      options,
      pipeline: findDealPipeline({
        pipelines,
        pipelineKey,
        stageValue: currentStageValue,
      }),
      isAdmin,
      isCreate,
      currentStageValue,
    });
  }, [
    isDealStage,
    isAdmin,
    options,
    pipelines,
    pipelineKey,
    currentStageValue,
    isCreate,
  ]);
};
