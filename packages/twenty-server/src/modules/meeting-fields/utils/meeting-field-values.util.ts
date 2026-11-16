import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

export type MeetingSource =
  | 'CALENDAR_SYNC'
  | 'LOGGED_IN_TWENTY'
  | 'API'
  | 'WORKFLOW'
  | 'IMPORT';

const MEETING_SOURCE_BY_ACTOR_SOURCE: Record<string, MeetingSource> = {
  CALENDAR: 'CALENDAR_SYNC',
  MANUAL: 'LOGGED_IN_TWENTY',
  API: 'API',
  WORKFLOW: 'WORKFLOW',
  IMPORT: 'IMPORT',
};

// Other creators (apps, agents, the server itself) leave it empty rather than guess
export const resolveMeetingSource = ({
  createdBySource,
  isWorkflowWrite,
  isCalendarSynced,
}: {
  createdBySource: string | null | undefined;
  isWorkflowWrite: boolean;
  isCalendarSynced: boolean;
}): MeetingSource | null => {
  if (isCalendarSynced) {
    return 'CALENDAR_SYNC';
  }

  if (isWorkflowWrite) {
    return 'WORKFLOW';
  }

  return isDefined(createdBySource)
    ? (MEETING_SOURCE_BY_ACTOR_SOURCE[createdBySource] ?? null)
    : null;
};

export const computeHasMeetingTranscript = ({
  transcriptUrl,
  hubspotHasTranscript,
}: {
  transcriptUrl: string | null | undefined;
  hubspotHasTranscript: boolean | null | undefined;
}): boolean =>
  isNonEmptyString(transcriptUrl?.trim()) || hubspotHasTranscript === true;
