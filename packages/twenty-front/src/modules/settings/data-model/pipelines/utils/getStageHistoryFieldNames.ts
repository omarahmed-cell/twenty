import { buildStageCalculatedPropertyFieldNames } from 'twenty-shared/utils';

import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';

export const getStageHistoryFieldNames = (
  pipelines: PipelineConfig[],
): Set<string> =>
  new Set(
    pipelines.flatMap(({ stages }) =>
      stages.flatMap(({ value }) =>
        Object.values(buildStageCalculatedPropertyFieldNames(value)),
      ),
    ),
  );
