import { isDefined } from 'twenty-shared/utils';

export type CalendarEventGuest = {
  isOrganizer: boolean;
  workspaceMemberId: string | null;
};

// The one workspace member among the non-organizer guests, or undefined when there is none or the choice is ambiguous
export const resolveAutoAssignedWorkspaceMemberId = (
  guests: CalendarEventGuest[],
): string | undefined => {
  const organizerWorkspaceMemberIds = new Set(
    guests
      .filter((guest) => guest.isOrganizer)
      .map((guest) => guest.workspaceMemberId)
      .filter(isDefined),
  );

  const candidateWorkspaceMemberIds = new Set(
    guests
      .filter((guest) => !guest.isOrganizer)
      .map((guest) => guest.workspaceMemberId)
      .filter(isDefined)
      .filter(
        (workspaceMemberId) =>
          !organizerWorkspaceMemberIds.has(workspaceMemberId),
      ),
  );

  return candidateWorkspaceMemberIds.size === 1
    ? [...candidateWorkspaceMemberIds][0]
    : undefined;
};
