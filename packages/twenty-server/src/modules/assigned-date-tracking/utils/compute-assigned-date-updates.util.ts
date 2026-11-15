import { isNonEmptyString } from '@sniptt/guards';

import { type AssignedDateTrackingConfig } from 'src/modules/assigned-date-tracking/types/assigned-date-tracking-config.type';

// Clearing the user keeps the date; imports bring their own dates through the backfill
export const computeAssignedDateUpdates = ({
  configs,
  before,
  after,
  isUpdate,
  isImport,
  changedAt,
}: {
  configs: AssignedDateTrackingConfig[];
  before: Record<string, unknown> | undefined;
  after: Record<string, unknown> | undefined;
  isUpdate: boolean;
  isImport: boolean;
  changedAt: string;
}): Record<string, string> => {
  if (isImport) {
    return {};
  }

  return Object.fromEntries(
    configs
      .filter(({ userFieldJoinColumnName }) => {
        const previousMemberId = isUpdate
          ? before?.[userFieldJoinColumnName]
          : undefined;
        const nextMemberId = after?.[userFieldJoinColumnName];

        return (
          isNonEmptyString(nextMemberId) && nextMemberId !== previousMemberId
        );
      })
      .map(({ assignedDateFieldName }) => [assignedDateFieldName, changedAt]),
  );
};
