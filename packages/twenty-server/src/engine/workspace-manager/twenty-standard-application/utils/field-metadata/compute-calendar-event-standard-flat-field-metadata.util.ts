import { msg } from '@lingui/core/macro';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import {
  DateDisplayFormat,
  FieldMetadataType,
  MetadataWritability,
  RelationOnDeleteAction,
  RelationType,
} from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import {
  type CreateStandardFieldArgs,
  createStandardFieldFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { createStandardRecordSourceFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-record-source-field-flat-metadata.util';
import { createStandardRelationFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-relation-field-flat-metadata.util';
export const buildCalendarEventStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'calendarEvent', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'calendarEvent'>, FlatFieldMetadata> => ({
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
      settings: { displayFormat: DateDisplayFormat.RELATIVE },
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
      settings: { displayFormat: DateDisplayFormat.RELATIVE },
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
      settings: { displayFormat: DateDisplayFormat.RELATIVE },
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
          message: `Calendar event record position`,
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
        msg({ message: `Title`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconH1',
      isNullable: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  isCanceled: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'isCanceled',
      type: FieldMetadataType.BOOLEAN,
      label: i18nLabel(
        msg({ message: `Is canceled`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Is canceled`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconCalendarCancel',
      isNullable: false,
      isUIEditable: false,
      defaultValue: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  isFullDay: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'isFullDay',
      type: FieldMetadataType.BOOLEAN,
      label: i18nLabel(
        msg({ message: `Is Full Day`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Is Full Day`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconHours24',
      isNullable: false,
      isUIEditable: false,
      defaultValue: false,
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
        msg({ message: `Start Date`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Start Date`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconCalendarClock',
      isNullable: true,
      isUIEditable: false,
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
        msg({ message: `End Date`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `End Date`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconCalendarClock',
      isNullable: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  externalCreatedAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'externalCreatedAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Creation DateTime`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Creation DateTime`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarPlus',
      isNullable: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  externalUpdatedAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'externalUpdatedAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Update DateTime`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Update DateTime`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarCog',
      isNullable: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  description: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'description',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Description`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Description`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconFileDescription',
      isNullable: true,
      isUIEditable: false,
      settings: { displayedMaxRows: 99 },
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
        msg({ message: `Location`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconMap',
      isNullable: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  iCalUid: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'iCalUid',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `iCal UID`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `iCal UID`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconKey',
      isNullable: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  conferenceSolution: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'conferenceSolution',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Conference Solution`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Conference Solution`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconScreenShare',
      isNullable: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  conferenceLink: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'conferenceLink',
      type: FieldMetadataType.LINKS,
      label: i18nLabel(
        msg({ message: `Meet Link`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Meet Link`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconLink',
      isNullable: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  recordedVideo: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'recordedVideo',
      type: FieldMetadataType.LINKS,
      label: i18nLabel(
        msg({ message: `Recorded Video`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Link to the meeting recording`,
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
  transcript: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'transcript',
      type: FieldMetadataType.LINKS,
      label: i18nLabel(
        msg({ message: `Transcript`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Link to the meeting transcript`,
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
      icon: 'IconMap',
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
          message: `Whether the meeting is physical or virtual`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUsersGroup',
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
          message: `What happened with the meeting, set by the rep`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconProgressCheck',
      isNullable: false,
      defaultValue: "'SCHEDULED'",
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
          id: '8170bbae-3d2f-47e5-ae73-3cba85e1962d',
          value: 'RESCHEDULED',
          label: i18nLabel(
            msg({ message: `Rescheduled`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'yellow',
        },
        {
          id: 'badc54af-4634-43ee-a17d-bf9da62b4d82',
          value: 'COMPLETED',
          label: i18nLabel(
            msg({ message: `Completed`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'green',
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
  assignedTo: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'assignedTo',
      label: i18nLabel(
        msg({ message: `Assigned to`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Account executive responsible for the meeting`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isNullable: true,
      targetObjectName: 'workspaceMember',
      targetFieldName: 'assignedCalendarEvents',
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
  hasMeetingTranscript: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'hasMeetingTranscript',
        type: FieldMetadataType.BOOLEAN,
        label: i18nLabel(
          msg({
            message: `Meeting transcript available`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Yes when the meeting has a transcript link, or HubSpot had a transcript at migration`,
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
    writability: MetadataWritability.SYSTEM,
  },
  hubspotHasTranscript: {
    ...createStandardFieldFlatMetadata({
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
            message: `Snapshot of HubSpot's 'Meeting transcript available' at migration time`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconFileText',
        isNullable: true,
        isUIEditable: false,
        isSystem: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  meetingSource: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'meetingSource',
        type: FieldMetadataType.SELECT,
        label: i18nLabel(
          msg({ message: `Meeting source`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({
            message: `How the meeting was created, set once when it is created`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconSourceCode',
        isNullable: true,
        isUIEditable: false,
        options: [
          {
            id: 'a24d8ba1-9182-421c-88a3-7f4bde6f074c',
            value: 'CALENDAR_SYNC',
            label: i18nLabel(
              msg({ message: `Calendar sync`, context: 'fieldMetadata.label' }),
            ),
            position: 0,
            color: 'sky',
          },
          {
            id: 'a2b98654-bcbb-4cbd-9272-c967315be1f6',
            value: 'LOGGED_IN_TWENTY',
            label: i18nLabel(
              msg({
                message: `Logged in Twenty`,
                context: 'fieldMetadata.label',
              }),
            ),
            position: 1,
            color: 'green',
          },
          {
            id: 'd8412e33-77b2-4739-850b-ba70453b41a7',
            value: 'API',
            label: i18nLabel(
              msg({ message: `API`, context: 'fieldMetadata.label' }),
            ),
            position: 2,
            color: 'purple',
          },
          {
            id: 'e9e155c8-8988-414d-aa96-f73c8799e39c',
            value: 'WORKFLOW',
            label: i18nLabel(
              msg({ message: `Workflow`, context: 'fieldMetadata.label' }),
            ),
            position: 3,
            color: 'orange',
          },
          {
            id: '2de28753-b7d2-4291-b3d0-3ad16291c6ed',
            value: 'IMPORT',
            label: i18nLabel(
              msg({ message: `Import`, context: 'fieldMetadata.label' }),
            ),
            position: 4,
            color: 'gray',
          },
          {
            id: 'c892808c-6dc8-42bd-9f5a-6c50430bd0a9',
            value: 'CRM_UI',
            label: i18nLabel(
              msg({ message: `CRM UI`, context: 'fieldMetadata.label' }),
            ),
            position: 5,
            color: 'blue',
          },
          {
            id: '71adc5bd-2b75-44ff-8d99-c4626acadd75',
            value: 'INTEGRATION',
            label: i18nLabel(
              msg({ message: `Integration`, context: 'fieldMetadata.label' }),
            ),
            position: 6,
            color: 'turquoise',
          },
          {
            id: 'e66aa749-dc79-40b1-a0f1-1c5c7d41a0bd',
            value: 'AVAILABILITY_SCHEDULE',
            label: i18nLabel(
              msg({
                message: `Meeting created from a proposed time`,
                context: 'fieldMetadata.label',
              }),
            ),
            position: 7,
            color: 'yellow',
          },
          {
            id: '43723b80-eb7d-4f63-86f7-fc5e71a9dd00',
            value: 'BIDIRECTIONAL_API',
            label: i18nLabel(
              msg({
                message: `Meeting created on calendar from CRM`,
                context: 'fieldMetadata.label',
              }),
            ),
            position: 8,
            color: 'pink',
          },
          {
            id: '7b88aecb-a908-4e48-941b-3c95e46d15c3',
            value: 'BIDIRECTIONAL_SYNC',
            label: i18nLabel(
              msg({
                message: `Meeting synced from calendar to CRM`,
                context: 'fieldMetadata.label',
              }),
            ),
            position: 9,
            color: 'red',
          },
          {
            id: 'c791c28d-e74c-428a-8104-52a249ac6017',
            value: 'MEETINGS_EMBEDDED',
            label: i18nLabel(
              msg({
                message: `Meetings (Embedded)`,
                context: 'fieldMetadata.label',
              }),
            ),
            position: 10,
            color: 'amber',
          },
          {
            id: '4eebb1d6-52d6-49e2-974e-28d744aad56a',
            value: 'MEETINGS_PUBLIC',
            label: i18nLabel(
              msg({
                message: `Meetings (Public)`,
                context: 'fieldMetadata.label',
              }),
            ),
            position: 11,
            color: 'lime',
          },
          {
            id: '3727ef21-415c-42dc-9faf-c40eec2c4c9a',
            value: 'MANUAL_LOGGING_FROM_CALENDAR',
            label: i18nLabel(
              msg({
                message: `Manual logging from calendar`,
                context: 'fieldMetadata.label',
              }),
            ),
            position: 12,
            color: 'cyan',
          },
          {
            id: 'b566cd02-87d5-4d68-96c9-23b69bc2c856',
            value: 'ADHOC_NOTETAKER',
            label: i18nLabel(
              msg({
                message: `Adhoc Notetaker`,
                context: 'fieldMetadata.label',
              }),
            ),
            position: 13,
            color: 'violet',
          },
        ],
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  calendarChannelEventAssociations: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'calendarChannelEventAssociations',
      label: i18nLabel(
        msg({
          message: `Calendar Channel Event Associations`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `Calendar Channel Event Associations`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendar',
      isNullable: false,
      isUIEditable: false,
      targetObjectName: 'calendarChannelEventAssociation',
      targetFieldName: 'calendarEvent',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  calendarEventParticipants: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'calendarEventParticipants',
      label: i18nLabel(
        msg({ message: `Event Participants`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Event Participants`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isNullable: false,
      isUIEditable: false,
      targetObjectName: 'calendarEventParticipant',
      targetFieldName: 'calendarEvent',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
      junctionTargetFieldUniversalIdentifier:
        STANDARD_OBJECTS.calendarEventParticipant.fields.person
          .universalIdentifier,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  calendarEventTargets: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'calendarEventTargets',
      label: i18nLabel(
        msg({ message: `Relations`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Calendar event targets`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconArrowUpRight',
      isNullable: true,
      targetObjectName: 'calendarEventTarget',
      targetFieldName: 'calendarEvent',
      settings: { relationType: RelationType.ONE_TO_MANY },
      junctionTargetFieldUniversalIdentifier:
        STANDARD_OBJECTS.calendarEventTarget.fields.targetPerson
          .universalIdentifier,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  callRecordings: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'callRecordings',
      label: i18nLabel(
        msg({ message: `Call Recordings`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Call Recordings`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconPhone',
      isNullable: false,
      isUIEditable: false,
      targetObjectName: 'callRecording',
      targetFieldName: 'calendarEvent',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
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
});
