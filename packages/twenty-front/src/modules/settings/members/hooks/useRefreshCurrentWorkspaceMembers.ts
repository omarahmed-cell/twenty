import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useApolloClient } from '@apollo/client/react';
import { useCallback } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { GetCurrentUserDocument } from '~/generated-metadata/graphql';

export const useRefreshCurrentWorkspaceMembers = () => {
  const client = useApolloClient();
  const setCurrentWorkspaceMembers = useSetAtomState(
    currentWorkspaceMembersState,
  );

  const refreshCurrentWorkspaceMembers = useCallback(async () => {
    const { data } = await client.query({
      query: GetCurrentUserDocument,
      fetchPolicy: 'network-only',
    });

    const workspaceMembers = data?.currentUser?.workspaceMembers;

    if (isDefined(workspaceMembers)) {
      setCurrentWorkspaceMembers(workspaceMembers);
    }
  }, [client, setCurrentWorkspaceMembers]);

  return { refreshCurrentWorkspaceMembers };
};
