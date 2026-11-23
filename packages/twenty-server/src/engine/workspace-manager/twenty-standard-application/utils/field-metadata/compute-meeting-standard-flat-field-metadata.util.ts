import { msg } from '@lingui/core/macro';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import {
  DateDisplayFormat,
  FieldMetadataType,
  RelationOnDeleteAction,
  RelationType,
} from 'twenty-shared/types';

import { STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT } from 'src/engine/metadata-modules/object-metadata/constants/standard-relation-field-properties.constant';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import {
  type CreateStandardFieldArgs,
  createStandardFieldFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { createStandardRecordSourceFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-record-source-field-flat-metadata.util';
import { createStandardRelationFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-relation-field-flat-metadata.util';
export const buildMeetingStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'meeting', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'meeting'>, FlatFieldMetadata> => ({
  id: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'id',
      type: FieldMetadataType.UUID,
      label: i18nLabel(msg({ message: `ID`, context: 'fieldMetadata.label' })),
      description: i18nLabel(
        msg({ message: `ID`, context: 'fieldMetadata.description' }),
      ),
      icon: 'Icon123',
      isSystem: true,
      isNullable: false,
      isUIEditable: false,
      defaultValue: 'uuid',
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  createdAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'createdAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Creation date`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Creation date`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconCalendar',
      isSystem: true,
      isNullable: false,
      isUIEditable: false,
      defaultValue: 'now',
      settings: {
        displayFormat: DateDisplayFormat.RELATIVE,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  updatedAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'updatedAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Last update`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Last time the record was changed`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarClock',
      isSystem: true,
      isNullable: false,
      isUIEditable: false,
      defaultValue: 'now',
      settings: {
        displayFormat: DateDisplayFormat.RELATIVE,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  deletedAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'deletedAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Deleted at`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Date when the record was deleted`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarMinus',
      isSystem: true,
      isNullable: true,
      isUIEditable: false,
      settings: {
        displayFormat: DateDisplayFormat.RELATIVE,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  position: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'position',
      type: FieldMetadataType.POSITION,
      label: i18nLabel(
        msg({ message: `Position`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Meeting record position`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconHierarchy2',
      isSystem: true,
      isNullable: false,
      defaultValue: 0,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  createdBy: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'createdBy',
      type: FieldMetadataType.ACTOR,
      label: i18nLabel(
        msg({ message: `Created by`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The creator of the record`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCreativeCommonsSa',
      isSystem: true,
      isUIEditable: false,
      isNullable: false,
      defaultValue: {
        source: "'MANUAL'",
        name: "'System'",
        workspaceMemberId: null,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  updatedBy: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'updatedBy',
      type: FieldMetadataType.ACTOR,
      label: i18nLabel(
        msg({ message: `Updated by`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The workspace member who last updated the record`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isSystem: true,
      isUIEditable: false,
      isNullable: false,
      defaultValue: {
        source: "'MANUAL'",
        name: "'System'",
        workspaceMemberId: null,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  searchVector: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'searchVector',
      type: FieldMetadataType.TS_VECTOR,
      label: i18nLabel(
        msg({ message: `Search vector`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Field used for full-text search`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUser',
      isSystem: true,
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  title: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'title',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Title`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Meeting title`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconH1',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  startsAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'startsAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Start time`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `When the meeting starts`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarClock',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  endsAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'endsAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `End time`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `When the meeting ends`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarClock',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  timezone: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'timezone',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Timezone`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `IANA timezone the meeting was scheduled in, e.g. Africa/Cairo`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconWorld',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  host: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'host',
      label: i18nLabel(
        msg({ message: `Host`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Workspace member who hosts the meeting; defaults to the creator`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserStar',
      isNullable: true,
      targetObjectName: 'workspaceMember',
      targetFieldName: 'hostedMeetings',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'hostId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  assignedTo: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'assignedTo',
      label: i18nLabel(
        msg({
          message: `Assigned to`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `Always the host; set by the server whenever the host changes`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isNullable: true,
      isUIEditable: false,
      targetObjectName: 'workspaceMember',
      targetFieldName: 'assignedMeetings',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'assignedToId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  meetingType: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'meetingType',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Meeting type`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Whether the meeting is physical or virtual (HubSpot call and meeting type)`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCategory',
      isNullable: true,
      options: [
        {
          id: '26b1138a-964c-422c-933a-a9e836bd7aed',
          value: 'PHYSICAL',
          label: i18nLabel(
            msg({ message: `Physical`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'orange',
        },
        {
          id: '7b13c727-b32d-4a85-b705-6a9238407972',
          value: 'VIRTUAL',
          label: i18nLabel(
            msg({ message: `Virtual`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'purple',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  meetingOutcome: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'meetingOutcome',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Meeting outcome`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `What happened with the meeting`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCircleCheck',
      isNullable: true,
      options: [
        {
          id: 'a7c07cc5-5714-4350-a808-eeda2b205fe5',
          value: 'SCHEDULED',
          label: i18nLabel(
            msg({ message: `Scheduled`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'sky',
        },
        {
          id: 'badc54af-4634-43ee-a17d-bf9da62b4d82',
          value: 'COMPLETED',
          label: i18nLabel(
            msg({ message: `Completed`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'green',
        },
        {
          id: '8170bbae-3d2f-47e5-ae73-3cba85e1962d',
          value: 'RESCHEDULED',
          label: i18nLabel(
            msg({ message: `Rescheduled`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'yellow',
        },
        {
          id: 'd0229669-3566-490c-80f0-e1dec35b8ba6',
          value: 'NO_SHOW',
          label: i18nLabel(
            msg({ message: `No Show`, context: 'fieldMetadata.label' }),
          ),
          position: 3,
          color: 'red',
        },
        {
          id: 'd8f97818-39cc-4c49-ba87-f055fdff91e8',
          value: 'CANCELED',
          label: i18nLabel(
            msg({ message: `Canceled`, context: 'fieldMetadata.label' }),
          ),
          position: 4,
          color: 'gray',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  locationType: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'locationType',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Location type`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `How the meeting takes place`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMapPin',
      isNullable: true,
      options: [
        {
          id: '3d055c1e-258b-439a-be84-81adeec58364',
          value: 'PHONE',
          label: i18nLabel(
            msg({ message: `Phone call`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'blue',
        },
        {
          id: 'fc75e91f-3b32-4a16-8412-d4308e7d81f7',
          value: 'ADDRESS',
          label: i18nLabel(
            msg({ message: `Address`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'green',
        },
        {
          id: 'e2b1f9a4-6c3d-4f0e-9a7b-5d8c2e1f4a63',
          value: 'CUSTOM',
          label: i18nLabel(
            msg({ message: `Custom`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'gray',
        },
        {
          id: '6e65760e-1600-424e-b6f4-aa4fe0e8a755',
          value: 'VIDEO_CONFERENCE',
          label: i18nLabel(
            msg({
              message: `Video Conference`,
              context: 'fieldMetadata.label',
            }),
          ),
          position: 3,
          color: 'turquoise',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  location: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'location',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Location`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Address, custom place or meeting link`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMapPin',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  meetLink: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'meetLink',
      type: FieldMetadataType.LINKS,
      label: i18nLabel(
        msg({ message: `Meet link`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Google Meet or other video link`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconVideo',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  attendeeDescription: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'attendeeDescription',
      type: FieldMetadataType.RICH_TEXT,
      label: i18nLabel(
        msg({
          message: `Attendee description`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `Description sent to attendees in the calendar invite`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconFileDescription',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  internalNote: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'internalNote',
      type: FieldMetadataType.RICH_TEXT,
      label: i18nLabel(
        msg({ message: `Internal note`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Private note of the rep, never sent to Google`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconNotes',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  googleEventId: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'googleEventId',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Google event ID`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Google Calendar event id`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconHash',
      isNullable: true,
      isSystem: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  googleCalendarId: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'googleCalendarId',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Google calendar ID`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Google Calendar holding the event`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconHash',
      isNullable: true,
      isSystem: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  googleICalUid: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'googleICalUid',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `iCal UID`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `iCalendar UID shared by every copy of the event`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconHash',
      isNullable: true,
      isSystem: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  source: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'source',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Source`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Where the meeting came from`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconSourceCode',
      isNullable: true,
      isUIEditable: false,
      options: [
        {
          id: '8745ca81-c0d8-4941-b980-76e50c0454e0',
          value: 'SCHEDULED_IN_CRM',
          label: i18nLabel(
            msg({
              message: `Scheduled in CRM`,
              context: 'fieldMetadata.label',
            }),
          ),
          position: 0,
          color: 'green',
        },
        {
          id: 'cac1d467-5d7c-4de8-9ea5-2ffd5fead092',
          value: 'CALENDAR_SYNC',
          label: i18nLabel(
            msg({ message: `Calendar sync`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'sky',
        },
        {
          id: '3b66f004-45a6-4992-8e8a-09bb1c2421b0',
          value: 'LOGGED_MANUALLY',
          label: i18nLabel(
            msg({ message: `Logged manually`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'purple',
        },
        {
          id: '64f443d2-b93a-460c-b5ff-1be7369d6c74',
          value: 'HUBSPOT_IMPORT',
          label: i18nLabel(
            msg({ message: `HubSpot import`, context: 'fieldMetadata.label' }),
          ),
          position: 3,
          color: 'orange',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  recordingUrl: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'recordingUrl',
      type: FieldMetadataType.LINKS,
      label: i18nLabel(
        msg({ message: `Recording`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Meet recording in Google Drive`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconPlayerPlay',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  recordingDriveFileId: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'recordingDriveFileId',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({
          message: `Recording Drive file ID`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `Drive file id of the recording`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconHash',
      isNullable: true,
      isSystem: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  geminiNotesUrl: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'geminiNotesUrl',
      type: FieldMetadataType.LINKS,
      label: i18nLabel(
        msg({ message: `Gemini notes`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Notes by Gemini document`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconSparkles',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  aiSummary: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'aiSummary',
      type: FieldMetadataType.RICH_TEXT,
      label: i18nLabel(
        msg({ message: `AI summary`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Gemini notes text, or the HubSpot AI summary of imported meetings`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconSparkles',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  transcriptDocUrl: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'transcriptDocUrl',
      type: FieldMetadataType.LINKS,
      label: i18nLabel(
        msg({ message: `Transcript document`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Transcript in Google Docs`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconFileText',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  transcript: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'transcript',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Transcript`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Full transcript text; loaded only on the meeting page and expanded timeline cards`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconFileText',
      isNullable: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  transcriptStatus: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'transcriptStatus',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Transcript status`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Whether a transcript is waiting, saved or unavailable`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconProgressCheck',
      isNullable: true,
      isUIEditable: false,
      options: [
        {
          id: '24222770-a7d5-4e96-a72e-4d4e69d03545',
          value: 'WAITING',
          label: i18nLabel(
            msg({ message: `Waiting`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'yellow',
        },
        {
          id: '9e41eae1-55f7-4f6a-b485-e958441048a8',
          value: 'READY',
          label: i18nLabel(
            msg({ message: `Ready`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'green',
        },
        {
          id: '564f14d8-0e24-41eb-9734-df9635aed584',
          value: 'NOT_RECORDED',
          label: i18nLabel(
            msg({ message: `Not recorded`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'gray',
        },
        {
          id: '101f054d-5c78-41a1-b774-82f98195a1d9',
          value: 'NOT_AVAILABLE',
          label: i18nLabel(
            msg({ message: `Not available`, context: 'fieldMetadata.label' }),
          ),
          position: 3,
          color: 'gray',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  artifactsCheckedAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'artifactsCheckedAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({
          message: `Artifacts checked at`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `Last time Meet recordings and transcripts were looked up`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconClock',
      isNullable: true,
      isSystem: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  hubspotId: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'hubspotId',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `HubSpot ID`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `HubSpot meeting ID, used to de-duplicate imports`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconId',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  hubspotHasTranscript: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'hubspotHasTranscript',
      type: FieldMetadataType.BOOLEAN,
      label: i18nLabel(
        msg({
          message: `Transcript in HubSpot`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `HubSpot had a transcript for this meeting when it was imported`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconFileText',
      isNullable: true,
      isSystem: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  recordSource: createStandardRecordSourceFieldFlatMetadata({
    objectName,
    workspaceId,
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  timelineActivities: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'timelineActivities',
      isSystemSideEffect: true,
      label: i18nLabel(
        STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.timelineActivity
          .label,
      ),
      description: i18nLabel(
        msg({
          message: `Timeline Activities linked to the meeting.`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT
        .timelineActivity.icon,
      isNullable: true,
      targetObjectName: 'timelineActivity',
      targetFieldName: 'targetMeeting',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  meetingTargets: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'meetingTargets',
      label: i18nLabel(
        msg({ message: `Relations`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Meeting targets`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconArrowUpRight',
      isNullable: true,
      targetObjectName: 'meetingTarget',
      targetFieldName: 'meeting',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
      junctionTargetFieldUniversalIdentifier:
        STANDARD_OBJECTS.meetingTarget.fields.targetPerson.universalIdentifier,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  attachments: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'attachments',
      isSystemSideEffect: true,
      label: i18nLabel(
        STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.attachment.label,
      ),
      description: i18nLabel(
        msg({
          message: `Meeting attachments`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.attachment
        .icon,
      isNullable: true,
      targetObjectName: 'attachment',
      targetFieldName: 'targetMeeting',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  meetingAttendees: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'meetingAttendees',
      label: i18nLabel(
        msg({ message: `Attendees`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `People and members invited to the meeting`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUsers',
      isNullable: true,
      targetObjectName: 'meetingAttendee',
      targetFieldName: 'meeting',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
});
