import { type PipelineBoardScope } from '@/pipeline/board/types/PipelineBoardScope';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';
import { ViewComponentInstanceContext } from '@/views/states/contexts/ViewComponentInstanceContext';

export const pipelineBoardScopeComponentState =
  createAtomComponentState<PipelineBoardScope | null>({
    key: 'pipelineBoardScopeComponentState',
    defaultValue: null,
    componentInstanceContext: ViewComponentInstanceContext,
  });
