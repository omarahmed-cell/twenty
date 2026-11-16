import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { type MeetingSourceAssignment } from 'src/modules/meeting-fields/services/meeting-fields.service';
import { resolveMeetingSource } from 'src/modules/meeting-fields/utils/meeting-field-values.util';

type LinksValue = { primaryLinkUrl?: string | null } | null | undefined;

const transcriptUrlOf = (record: Record<string, unknown> | undefined) =>
  (record?.transcript as LinksValue)?.primaryLinkUrl ?? null;

export const buildMeetingFieldUpdates = ({
  events,
  isCreate,
  isWorkflowWrite,
}: {
  events: ObjectRecordBaseEvent<Record<string, unknown>>[];
  isCreate: boolean;
  isWorkflowWrite: boolean;
}): {
  meetingSources: MeetingSourceAssignment[];
  transcriptRecordIds: string[];
} => {
  const meetingSources: MeetingSourceAssignment[] = [];
  const transcriptRecordIds: string[] = [];

  for (const event of events) {
    const before = event.properties?.before;
    const after = event.properties?.after;
    const recordId = event.recordId ?? (after?.id as string | undefined);

    if (!isDefined(recordId) || !isDefined(after)) {
      continue;
    }

    // The calendar sync sets its own source on insert
    if (isCreate && !isDefined(after.meetingSource)) {
      const meetingSource = resolveMeetingSource({
        createdBySource: (after.createdBy as { source?: string } | undefined)
          ?.source,
        isWorkflowWrite,
        isCalendarSynced: false,
      });

      if (isDefined(meetingSource)) {
        meetingSources.push({ recordId, meetingSource });
      }
    }

    if (
      isCreate ||
      transcriptUrlOf(before) !== transcriptUrlOf(after) ||
      before?.hubspotHasTranscript !== after.hubspotHasTranscript
    ) {
      transcriptRecordIds.push(recordId);
    }
  }

  return { meetingSources, transcriptRecordIds };
};
