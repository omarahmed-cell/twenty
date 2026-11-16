import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

// Keyed by workspace member so people sharing a browser keep their own choice
export const pipelineBoardSelectedPipelineKeyByWorkspaceMemberIdState =
  createAtomState<Record<string, string>>({
    key: 'pipelineBoardSelectedPipelineKeyByWorkspaceMemberIdState',
    defaultValue: {},
    useLocalStorage: true,
    validateInitFn: (payload) =>
      typeof payload === 'object' && !Array.isArray(payload),
  });
