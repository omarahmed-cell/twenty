import { AppChip } from '@/applications/components/AppChip';
import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getWorkspaceMemberLabelWithStatus } from '@/workspace-member/utils/getWorkspaceMemberLabelWithStatus';
import { type FieldActorValue } from '@/object-record/record-field/ui/types/FieldMetadata';
import { getChipLabel } from '@/ui/field/display/utils/getChipLabel';

import { AvatarOrIcon } from '@/ui/field/display/components/internal/AvatarOrIcon/AvatarOrIcon';
import { getActorSourceIcon } from '@/ui/field/display/utils/getActorSourceIcon';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { Chip } from 'twenty-ui/primitives/data-display';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';

type ActorDisplayProps = Partial<FieldActorValue> & {
  avatarUrl?: string | null;
};

export const ActorDisplay = ({
  name,
  source,
  workspaceMemberId,
  avatarUrl,
  context,
}: ActorDisplayProps) => {
  const LeftIcon = getActorSourceIcon({ source, context });
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );

  const actorWorkspaceMember = isDefined(workspaceMemberId)
    ? currentWorkspaceMembers.find(
        (workspaceMember) => workspaceMember.id === workspaceMemberId,
      )
    : undefined;

  const label = isNonEmptyString(name)
    ? getWorkspaceMemberLabelWithStatus({
        label: name,
        memberStatus: actorWorkspaceMember?.memberStatus,
      })
    : name;

  return (
    <Chip
      variant="ghost"
      startElement={
        source === 'APPLICATION' && isDefined(context?.applicationId) ? (
          <AppChip
            applicationId={context.applicationId}
            fallbackApplicationData={{ name }}
            size="sm"
            chipOnly
          />
        ) : (
          <AvatarOrIcon
            colorSeed={workspaceMemberId ?? undefined}
            shape={workspaceMemberId ? 'circle' : 'square'}
            name={name}
            Icon={LeftIcon}
            src={getAbsoluteImageUrl(avatarUrl ?? undefined)}
          />
        )
      }
      style={{ paddingInlineStart: 0 }}
    >
      {getChipLabel(label).content}
    </Chip>
  );
};
