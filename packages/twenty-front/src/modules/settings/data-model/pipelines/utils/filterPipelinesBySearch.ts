import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import { normalizeSearchText } from 'twenty-ui/utilities';

export const filterPipelinesBySearch = (
  pipelines: PipelineConfig[],
  searchTerm: string,
): PipelineConfig[] => {
  const normalizedSearchTerm = normalizeSearchText(searchTerm.trim());

  if (normalizedSearchTerm === '') {
    return pipelines;
  }

  return pipelines.filter((pipeline) =>
    normalizeSearchText(pipeline.name).includes(normalizedSearchTerm),
  );
};
