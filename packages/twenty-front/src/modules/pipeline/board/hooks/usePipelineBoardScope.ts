import { recordIndexViewTypeState } from '@/object-record/record-index/states/recordIndexViewTypeState';
import { pipelineBoardScopeComponentState } from '@/pipeline/board/states/pipelineBoardScopeComponentState';
import { type PipelineBoardScope } from '@/pipeline/board/types/PipelineBoardScope';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { ViewType } from '@/views/types/ViewType';

// Grouped table views of the same object share the view instance, so the scope only counts on boards
export const usePipelineBoardScope = (): PipelineBoardScope | null => {
  const pipelineBoardScope = useAtomComponentStateValue(
    pipelineBoardScopeComponentState,
  );

  const recordIndexViewType = useAtomComponentStateValue(
    recordIndexViewTypeState,
  );

  return recordIndexViewType === ViewType.KANBAN ? pipelineBoardScope : null;
};
