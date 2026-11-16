import { useEffect } from 'react';

import { usePipelineBoardRememberedPipelineKey } from '@/pipeline/board/hooks/usePipelineBoardRememberedPipelineKey';
import { pipelineBoardScopeComponentState } from '@/pipeline/board/states/pipelineBoardScopeComponentState';
import { resolvePipelineBoardScope } from '@/pipeline/board/utils/resolvePipelineBoardScope';
import { usePipelineConfigs } from '@/pipeline/hooks/usePipelineConfigs';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';

// Mirrors the live pipeline config into the board scope, and drops the scope when the board unmounts
export const PipelineBoardScopeEffect = () => {
  const { pipelines, loading } = usePipelineConfigs();
  const { rememberedPipelineKey } = usePipelineBoardRememberedPipelineKey();

  const [pipelineBoardScope, setPipelineBoardScope] = useAtomComponentState(
    pipelineBoardScopeComponentState,
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    const nextPipelineBoardScope = resolvePipelineBoardScope({
      pipelines,
      rememberedPipelineKey,
    });

    if (
      JSON.stringify(nextPipelineBoardScope) !==
      JSON.stringify(pipelineBoardScope)
    ) {
      setPipelineBoardScope(nextPipelineBoardScope);
    }
  }, [
    loading,
    pipelines,
    rememberedPipelineKey,
    pipelineBoardScope,
    setPipelineBoardScope,
  ]);

  useEffect(() => () => setPipelineBoardScope(null), [setPipelineBoardScope]);

  return null;
};
