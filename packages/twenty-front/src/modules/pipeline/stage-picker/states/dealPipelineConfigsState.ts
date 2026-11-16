import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const dealPipelineConfigsState = createAtomState<PipelineConfig[]>({
  key: 'dealPipelineConfigsState',
  defaultValue: [],
});
