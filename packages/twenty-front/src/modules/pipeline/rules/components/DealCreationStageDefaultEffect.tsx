import { useEffect } from 'react';
import { isDefined } from 'twenty-shared/utils';

import { usePipelineAdminStatus } from '@/pipeline/rules/hooks/useIsPipelineAdmin';
import { getDealCreationStageFallback } from '@/pipeline/rules/utils/applyDealStageRules';
import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';

type DealCreationStageDefaultEffectProps = {
  pipeline: PipelineConfig;
  draftStageValue: string | null;
  onStageChange: (stageValue: string) => void;
};

// A prefilled or defaulted stage the rules refuse would only fail on save, so the form starts in an allowed one
export const DealCreationStageDefaultEffect = ({
  pipeline,
  draftStageValue,
  onStageChange,
}: DealCreationStageDefaultEffectProps) => {
  const { isAdmin, isLoaded } = usePipelineAdminStatus();

  const fallbackStageValue = isLoaded
    ? getDealCreationStageFallback({ pipeline, isAdmin, draftStageValue })
    : undefined;

  useEffect(() => {
    if (isDefined(fallbackStageValue)) {
      onStageChange(fallbackStageValue);
    }
  }, [fallbackStageValue, onStageChange]);

  return null;
};
