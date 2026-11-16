import { useMemo } from 'react';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import { buildPipelineConfigs } from '@/pipeline/utils/buildPipelineConfigs';
import { CoreObjectNameSingular } from 'twenty-shared/types';

const PIPELINE_CONFIG_LIMIT = 200;

// Reads the pipeline config live, so Settings changes show without editing views
export const usePipelineConfigs = ({
  objectNameSingular = CoreObjectNameSingular.Opportunity,
  skip = false,
}: {
  objectNameSingular?: string;
  skip?: boolean;
} = {}) => {
  const { records: pipelineRecords, loading: pipelinesLoading } =
    useFindManyRecords({
      objectNameSingular: CoreObjectNameSingular.Pipeline,
      orderBy: [{ position: 'AscNullsLast' }],
      limit: PIPELINE_CONFIG_LIMIT,
      skip,
    });

  const { records: pipelineStageRecords, loading: stagesLoading } =
    useFindManyRecords({
      objectNameSingular: CoreObjectNameSingular.PipelineStage,
      orderBy: [{ position: 'AscNullsLast' }],
      limit: PIPELINE_CONFIG_LIMIT * 4,
      skip,
    });

  const pipelines = useMemo<PipelineConfig[]>(
    () =>
      buildPipelineConfigs({ pipelineRecords, pipelineStageRecords }).filter(
        (pipeline) => pipeline.objectNameSingular === objectNameSingular,
      ),
    [pipelineRecords, pipelineStageRecords, objectNameSingular],
  );

  const pipelineByKey = useMemo(
    () => new Map(pipelines.map((pipeline) => [pipeline.key, pipeline])),
    [pipelines],
  );

  const pipelineByStageValue = useMemo(
    () =>
      new Map(
        pipelines.flatMap((pipeline) =>
          pipeline.stages.map((stage) => [stage.value, pipeline] as const),
        ),
      ),
    [pipelines],
  );

  return {
    pipelines,
    pipelineByKey,
    pipelineByStageValue,
    loading: pipelinesLoading || stagesLoading,
  };
};
