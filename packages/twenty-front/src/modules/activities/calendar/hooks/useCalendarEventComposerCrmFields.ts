import { useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';

export type CalendarEventCrmFields = {
  locationType: string | null;
  meetingType: string | null;
  meetingOutcome: string;
  assignedToId: string | null;
};

const DEFAULT_CALENDAR_EVENT_CRM_FIELDS: CalendarEventCrmFields = {
  locationType: null,
  meetingType: null,
  meetingOutcome: 'SCHEDULED',
  assignedToId: null,
};

// These fields stay on the Twenty record: the provider only receives what the create mutation sends
export const useCalendarEventComposerCrmFields = () => {
  const [crmFields, setCrmFields] = useState<CalendarEventCrmFields>(
    DEFAULT_CALENDAR_EVENT_CRM_FIELDS,
  );
  const { updateOneRecord } = useUpdateOneRecord();

  const setCrmField = <TFieldName extends keyof CalendarEventCrmFields>(
    fieldName: TFieldName,
    value: CalendarEventCrmFields[TFieldName],
  ) => setCrmFields((current) => ({ ...current, [fieldName]: value }));

  const saveCrmFields = (calendarEventId: string) =>
    updateOneRecord({
      objectNameSingular: CoreObjectNameSingular.CalendarEvent,
      idToUpdate: calendarEventId,
      updateOneRecordInput: crmFields,
    });

  return { crmFields, setCrmField, saveCrmFields };
};
