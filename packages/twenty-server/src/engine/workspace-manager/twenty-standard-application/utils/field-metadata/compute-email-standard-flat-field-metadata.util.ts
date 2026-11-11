import { msg } from '@lingui/core/macro';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import {
  DateDisplayFormat,
  FieldMetadataType,
  RelationType,
} from 'twenty-shared/types';

import { STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT } from 'src/engine/metadata-modules/object-metadata/constants/standard-relation-field-properties.constant';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import {
  type CreateStandardFieldArgs,
  createStandardFieldFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { createStandardRelationFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-relation-field-flat-metadata.util';
export const buildEmailStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'email', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'email'>, FlatFieldMetadata> => ({
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
          message: `Email record position`,
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
  subject: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'subject',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Subject`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Email subject`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMail',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  bodyV2: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'bodyV2',
      type: FieldMetadataType.RICH_TEXT,
      label: i18nLabel(
        msg({ message: `Body`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Email body`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconFilePencil',
      isNullable: true,
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

  direction: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'direction',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Direction`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Whether the email was received or sent`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconArrowsExchange',
      isNullable: true,
      options: [
        {
          id: 'bc0c4525-a29e-47e0-baa8-468d6a377c13',
          value: 'INCOMING',
          label: i18nLabel(
            msg({ message: `Incoming`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'green',
        },
        {
          id: 'a7ce3b5b-9c2b-439a-a6a2-b0436f311329',
          value: 'OUTGOING',
          label: i18nLabel(
            msg({ message: `Outgoing`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'blue',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  from: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'from',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `From`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Sender email address`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  to: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'to',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(msg({ message: `To`, context: 'fieldMetadata.label' })),
      description: i18nLabel(
        msg({
          message: `Recipient email addresses`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUsers',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  sentAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'sentAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Sent at`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `When the email was sent`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  status: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'status',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Status`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Email delivery status`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconProgressCheck',
      isNullable: true,
      options: [
        {
          id: 'a741ea03-9a00-48dd-b54f-4e1511857338',
          value: 'SENT',
          label: i18nLabel(
            msg({ message: `Sent`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'green',
        },
        {
          id: 'e1639365-0d9d-440b-be24-22bc779baca4',
          value: 'SCHEDULED',
          label: i18nLabel(
            msg({ message: `Scheduled`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'blue',
        },
        {
          id: '2adb59f9-a90d-43ce-86ae-d1b3dd054559',
          value: 'BOUNCED',
          label: i18nLabel(
            msg({ message: `Bounced`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'orange',
        },
        {
          id: 'd3441109-3204-4fcf-9800-a75291719d6f',
          value: 'FAILED',
          label: i18nLabel(
            msg({ message: `Failed`, context: 'fieldMetadata.label' }),
          ),
          position: 3,
          color: 'red',
        },
      ],
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
          message: `HubSpot engagement ID, used to de-duplicate imports`,
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
          message: `Timeline Activities linked to the email.`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT
        .timelineActivity.icon,
      isNullable: true,
      targetObjectName: 'timelineActivity',
      targetFieldName: 'targetEmail',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  emailTargets: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'emailTargets',
      label: i18nLabel(
        msg({ message: `Relations`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Email targets`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconArrowUpRight',
      isNullable: true,
      targetObjectName: 'emailTarget',
      targetFieldName: 'email',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
      junctionTargetFieldUniversalIdentifier:
        STANDARD_OBJECTS.emailTarget.fields.targetPerson.universalIdentifier,
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
          message: `Email attachments`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.attachment
        .icon,
      isNullable: true,
      targetObjectName: 'attachment',
      targetFieldName: 'targetEmail',
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
