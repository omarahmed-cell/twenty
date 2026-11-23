import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardMeetingAttendeeViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'meetingAttendee'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allMeetingAttendeesEmail: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'meetingAttendee',
      context: {
        viewName: 'allMeetingAttendees',
        viewFieldName: 'email',
        fieldName: 'email',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allMeetingAttendeesDisplayName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'meetingAttendee',
      context: {
        viewName: 'allMeetingAttendees',
        viewFieldName: 'displayName',
        fieldName: 'displayName',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allMeetingAttendeesMeeting: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'meetingAttendee',
      context: {
        viewName: 'allMeetingAttendees',
        viewFieldName: 'meeting',
        fieldName: 'meeting',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allMeetingAttendeesPerson: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'meetingAttendee',
      context: {
        viewName: 'allMeetingAttendees',
        viewFieldName: 'person',
        fieldName: 'person',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allMeetingAttendeesWorkspaceMember: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'meetingAttendee',
      context: {
        viewName: 'allMeetingAttendees',
        viewFieldName: 'workspaceMember',
        fieldName: 'workspaceMember',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
    allMeetingAttendeesResponseStatus: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'meetingAttendee',
      context: {
        viewName: 'allMeetingAttendees',
        viewFieldName: 'responseStatus',
        fieldName: 'responseStatus',
        position: 5,
        isVisible: true,
        size: 150,
      },
    }),
    allMeetingAttendeesIsOrganizer: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'meetingAttendee',
      context: {
        viewName: 'allMeetingAttendees',
        viewFieldName: 'isOrganizer',
        fieldName: 'isOrganizer',
        position: 6,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
