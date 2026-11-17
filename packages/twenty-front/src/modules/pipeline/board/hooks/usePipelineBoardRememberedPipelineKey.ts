import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { pipelineBoardSelectedPipelineKeyByWorkspaceMemberIdState } from '@/pipeline/board/states/pipelineBoardSelectedPipelineKeyByWorkspaceMemberIdState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

// Deal choices keep their original key so choices saved before services had boards survive
const buildRememberedPipelineStorageKey = ({
  workspaceMemberId,
  objectNameSingular,
}: {
  workspaceMemberId: string;
  objectNameSingular: string;
}) =>
  objectNameSingular === CoreObjectNameSingular.Opportunity
    ? workspaceMemberId
    : `${workspaceMemberId}:${objectNameSingular}`;

export const usePipelineBoardRememberedPipelineKey = ({
  objectNameSingular,
}: {
  objectNameSingular: string;
}) => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const [
    pipelineBoardSelectedPipelineKeyByWorkspaceMemberId,
    setPipelineBoardSelectedPipelineKeyByWorkspaceMemberId,
  ] = useAtomState(pipelineBoardSelectedPipelineKeyByWorkspaceMemberIdState);

  const workspaceMemberId = currentWorkspaceMember?.id;

  const storageKey = isDefined(workspaceMemberId)
    ? buildRememberedPipelineStorageKey({
        workspaceMemberId,
        objectNameSingular,
      })
    : undefined;

  const rememberedPipelineKey = isDefined(storageKey)
    ? pipelineBoardSelectedPipelineKeyByWorkspaceMemberId[storageKey]
    : undefined;

  const rememberPipelineKey = (pipelineKey: string) => {
    if (!isDefined(storageKey)) {
      return;
    }

    setPipelineBoardSelectedPipelineKeyByWorkspaceMemberId((previous) => ({
      ...previous,
      [storageKey]: pipelineKey,
    }));
  };

  return { rememberedPipelineKey, rememberPipelineKey };
};
