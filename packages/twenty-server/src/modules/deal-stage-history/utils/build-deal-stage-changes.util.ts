import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { isImportWrite } from 'src/modules/assigned-date-tracking/utils/is-import-write.util';
import {
  type DealStageChange,
  type DealStageChangeActor,
} from 'src/modules/deal-stage-history/services/deal-stage-history.service';

const toActor = (value: unknown): DealStageChangeActor => {
  const actor = (value ?? {}) as Partial<DealStageChangeActor>;

  return {
    source: actor.source ?? 'MANUAL',
    name: actor.name ?? 'System',
    workspaceMemberId: actor.workspaceMemberId ?? null,
  };
};

// Imports are skipped: the loader writes the HubSpot stage dates and times itself
export const buildDealStageChanges = ({
  events,
  isUpdate,
  isWorkflowWrite,
  changedAt,
}: {
  events: ObjectRecordBaseEvent<Record<string, unknown>>[];
  isUpdate: boolean;
  isWorkflowWrite: boolean;
  changedAt: string;
}): DealStageChange[] =>
  events
    .map((event): DealStageChange | null => {
      const before = event.properties?.before;
      const after = event.properties?.after;
      const recordId = event.recordId ?? (after?.id as string | undefined);

      if (!isDefined(recordId) || !isDefined(after)) {
        return null;
      }

      const fromStage = isUpdate
        ? ((before?.stage as string | null | undefined) ?? null)
        : null;
      const toStage = (after.stage as string | null | undefined) ?? null;

      if (fromStage === toStage || isImportWrite(after, isUpdate)) {
        return null;
      }

      const writeActor = toActor(isUpdate ? after.updatedBy : after.createdBy);

      return {
        recordId,
        pipeline: (after.pipeline as string | null | undefined) ?? null,
        fromStage,
        toStage,
        changedAt,
        changedBy: isWorkflowWrite
          ? {
              source: 'WORKFLOW',
              name: 'Workflow',
              workspaceMemberId: writeActor.workspaceMemberId,
            }
          : writeActor,
      };
    })
    .filter(isDefined);
