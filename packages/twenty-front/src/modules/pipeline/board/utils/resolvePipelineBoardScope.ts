import { type PipelineBoardScope } from '@/pipeline/board/types/PipelineBoardScope';
import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import { isDefined } from 'twenty-shared/utils';

// A remembered pipeline that no longer exists falls back to the first one
export const resolvePipelineBoardScope = ({
  pipelines,
  rememberedPipelineKey,
}: {
  pipelines: PipelineConfig[];
  rememberedPipelineKey: string | undefined;
}): PipelineBoardScope | null => {
  const pipeline =
    pipelines.find(({ key }) => key === rememberedPipelineKey) ?? pipelines[0];

  if (!isDefined(pipeline)) {
    return null;
  }

  return {
    pipelineKey: pipeline.key,
    stageValues: pipeline.stages.map(({ value }) => value),
  };
};
