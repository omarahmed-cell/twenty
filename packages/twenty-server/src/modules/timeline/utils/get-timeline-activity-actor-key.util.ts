import { type ActorMetadata } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

// Changes are only folded into a recent row when the same actor made them, so history keeps each source apart
export const getTimelineActivityActorKey = (
  properties: unknown,
): string | null => {
  const updatedBy = (properties as { updatedBy?: ActorMetadata } | null)
    ?.updatedBy;

  if (!isDefined(updatedBy)) {
    return null;
  }

  return JSON.stringify([
    updatedBy.source,
    updatedBy.workspaceMemberId ?? null,
    updatedBy.context?.workflowRunId ?? null,
  ]);
};
