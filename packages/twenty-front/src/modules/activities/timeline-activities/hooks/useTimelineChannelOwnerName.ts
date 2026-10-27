import { useQuery } from '@apollo/client/react';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { getFullName } from '@/activities/timeline-activities/utils/getFullName';
import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { GetTimelineChannelOwnersDocument } from '~/generated/graphql';

export const useTimelineChannelOwnerName = () => {
  const apolloCoreClient = useApolloCoreClient();
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );

  const { data } = useQuery(GetTimelineChannelOwnersDocument, {
    client: apolloCoreClient,
  });

  const getChannelOwnerName = (
    channelIds: (string | null | undefined)[],
  ): string | undefined => {
    const owner = data?.getTimelineChannelOwners.find((channelOwner) =>
      channelIds.includes(channelOwner.channelId),
    );

    if (!isDefined(owner)) {
      return undefined;
    }

    const fullName = getFullName(
      currentWorkspaceMembers.find(
        (workspaceMember) => workspaceMember.id === owner.workspaceMemberId,
      )?.name,
    );

    return isNonEmptyString(fullName) ? fullName : undefined;
  };

  return { getChannelOwnerName };
};
