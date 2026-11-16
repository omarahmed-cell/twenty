import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { pipelineBoardSelectedPipelineKeyByWorkspaceMemberIdState } from '@/pipeline/board/states/pipelineBoardSelectedPipelineKeyByWorkspaceMemberIdState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';

export const usePipelineBoardRememberedPipelineKey = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const [
    pipelineBoardSelectedPipelineKeyByWorkspaceMemberId,
    setPipelineBoardSelectedPipelineKeyByWorkspaceMemberId,
  ] = useAtomState(pipelineBoardSelectedPipelineKeyByWorkspaceMemberIdState);

  const workspaceMemberId = currentWorkspaceMember?.id;

  const rememberedPipelineKey = isDefined(workspaceMemberId)
    ? pipelineBoardSelectedPipelineKeyByWorkspaceMemberId[workspaceMemberId]
    : undefined;

  const rememberPipelineKey = (pipelineKey: string) => {
    if (!isDefined(workspaceMemberId)) {
      return;
    }

    setPipelineBoardSelectedPipelineKeyByWorkspaceMemberId((previous) => ({
      ...previous,
      [workspaceMemberId]: pipelineKey,
    }));
  };

  return { rememberedPipelineKey, rememberPipelineKey };
};
