import { type RoboostFieldHistorySource } from '@/roboost-app/history/types/RoboostFieldHistoryEntry';
import { isNonEmptyString } from '@sniptt/guards';
import { type ActorMetadata, FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const getRoboostFieldHistorySource = ({
  updatedBy,
  workspaceMemberId,
}: {
  updatedBy: ActorMetadata | undefined;
  workspaceMemberId: string | null | undefined;
}): RoboostFieldHistorySource => {
  if (!isDefined(updatedBy)) {
    // Rows written before the actor was recorded only know the member
    return isNonEmptyString(workspaceMemberId) ? 'user' : 'system';
  }

  if (isNonEmptyString(updatedBy.context?.workflowId)) {
    return 'workflow';
  }

  switch (updatedBy.source) {
    case FieldActorSource.MANUAL:
      return 'user';
    case FieldActorSource.WORKFLOW:
      return 'workflow';
    case FieldActorSource.IMPORT:
      return 'import';
    case FieldActorSource.API:
    case FieldActorSource.WEBHOOK:
    case FieldActorSource.APPLICATION:
      return 'api';
    default:
      return 'system';
  }
};
