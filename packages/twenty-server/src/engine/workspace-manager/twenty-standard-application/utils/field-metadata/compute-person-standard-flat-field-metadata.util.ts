import { msg } from '@lingui/core/macro';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';

import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import {
  DateDisplayFormat,
  FieldMetadataType,
  NumberDataType,
  MetadataWritability,
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
export const buildPersonStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'person', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'person'>, FlatFieldMetadata> => ({
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

  mergedRecordIds: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'mergedRecordIds',
        type: FieldMetadataType.ARRAY,
        label: i18nLabel(
          msg({
            message: `Merged contact IDs`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `IDs of records merged into this one (HubSpot IDs from the import, CRM IDs from merges here)`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconGitMerge',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  name: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'name',
      type: FieldMetadataType.FULL_NAME,
      label: i18nLabel(
        msg({ message: `Name`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Contact's name`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUser',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  emails: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'emails',
      type: FieldMetadataType.EMAILS,
      label: i18nLabel(
        msg({ message: `Emails`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Contact's Emails`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMail',
      isNullable: true,
      isUnique: true,
      settings: {
        maxNumberOfValues: 1,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  linkedinLink: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'linkedinLink',
      type: FieldMetadataType.LINKS,
      label: i18nLabel(
        msg({ message: `Linkedin`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Contact's Linkedin account`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconBrandLinkedin',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  jobTitle: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'jobTitle',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Job Title`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Contact's job title`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconBriefcase',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  phones: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'phones',
      type: FieldMetadataType.PHONES,
      label: i18nLabel(
        msg({ message: `Phones`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Contact's phone numbers`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconPhone',
      isNullable: true,
      settings: {
        maxNumberOfValues: 1,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  //deprecated
  avatarUrl: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'avatarUrl',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Avatar`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Contact's avatar`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconFileUpload',
      isSystem: true,
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  avatarFile: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'avatarFile',
      type: FieldMetadataType.FILES,
      label: i18nLabel(
        msg({ message: `Avatar File`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Contact's avatar file`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconFileUpload',
      isSystem: true,
      isNullable: true,
      settings: {
        maxNumberOfValues: 1,
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
          message: `Person record Position`,
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

  company: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'company',
      label: i18nLabel(
        msg({ message: `Company`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Contact's company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconBuildingSkyscraper',
      isNullable: true,
      targetObjectName: 'company',
      targetFieldName: 'people',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'companyId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  pointOfContactForOpportunities: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'pointOfContactForOpportunities',
      label: i18nLabel(
        msg({ message: `Deals`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `List of opportunities for which that person is the point of contact`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconTargetArrow',
      isNullable: true,
      targetObjectName: 'opportunity',
      targetFieldName: 'pointOfContact',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  services: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'services',
      label: i18nLabel(
        msg({ message: `Services`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Services where the person is the point of contact`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconBriefcase',
      isNullable: true,
      targetObjectName: 'service',
      targetFieldName: 'pointOfContact',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  taskTargets: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'taskTargets',
      isSystemSideEffect: true,
      label: i18nLabel(
        STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.taskTarget.label,
      ),
      description: i18nLabel(
        msg({
          message: `Tasks tied to the contact`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.taskTarget
        .icon,
      isNullable: true,
      targetObjectName: 'taskTarget',
      targetFieldName: 'targetPerson',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  noteTargets: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'noteTargets',
      isSystemSideEffect: true,
      label: i18nLabel(
        STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.noteTarget.label,
      ),
      description: i18nLabel(
        msg({
          message: `Notes tied to the contact`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.noteTarget
        .icon,
      isNullable: true,
      targetObjectName: 'noteTarget',
      targetFieldName: 'targetPerson',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  agentChatThreadTargets: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'agentChatThreadTargets',
      isSystemSideEffect: true,
      label: i18nLabel(
        STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT
          .agentChatThreadTarget.label,
      ),
      description: i18nLabel(
        msg({
          message: `Chats tied to the contact`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT
        .agentChatThreadTarget.icon,
      isUIEditable: false,
      isNullable: true,
      targetObjectName: 'agentChatThreadTarget',
      targetFieldName: 'targetPerson',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
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
      isSystemSideEffect: true,
      label: i18nLabel(
        msg({ message: `Calendar events`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Calendar events tied to the contact`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendar',
      isUIEditable: false,
      isNullable: true,
      targetObjectName: 'calendarEventTarget',
      targetFieldName: 'targetPerson',
      settings: { relationType: RelationType.ONE_TO_MANY },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  messageThreadTargets: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'messageThreadTargets',
      isSystemSideEffect: true,
      label: i18nLabel(
        msg({ message: `Emails`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Message threads tied to the contact`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMail',
      isUIEditable: false,
      isNullable: true,
      targetObjectName: 'messageThreadTarget',
      targetFieldName: 'targetPerson',
      settings: { relationType: RelationType.ONE_TO_MANY },
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
          message: `Attachments linked to the contact.`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.attachment
        .icon,
      isNullable: true,
      targetObjectName: 'attachment',
      targetFieldName: 'targetPerson',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  messageParticipants: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'messageParticipants',
      label: i18nLabel(
        msg({
          message: `Message Participants`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `Message Participants`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isNullable: true,
      targetObjectName: 'messageParticipant',
      targetFieldName: 'person',
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
        msg({
          message: `Calendar Event Participants`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `Calendar Event Participants`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendar',
      isNullable: true,
      targetObjectName: 'calendarEventParticipant',
      targetFieldName: 'person',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
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
        msg({ message: `Events`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Events linked to the person`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconTimelineEvent',
      isNullable: true,
      targetObjectName: 'timelineActivity',
      targetFieldName: 'targetPerson',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  listMemberships: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'listMemberships',
      label: i18nLabel(
        msg({ message: `Lists`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Lists the contact belongs to`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUsersGroup',
      isUIEditable: true,
      isNullable: true,
      targetObjectName: 'messageListMember',
      targetFieldName: 'person',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
      junctionTargetFieldUniversalIdentifier:
        STANDARD_OBJECTS.messageListMember.fields.list.universalIdentifier,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  opportunities: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'opportunities',
      label: i18nLabel(
        msg({ message: `Deals`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Deals the contact is on`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconTargetArrow',
      isUIEditable: true,
      isNullable: true,
      targetObjectName: 'opportunityContact',
      targetFieldName: 'person',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
      junctionTargetFieldUniversalIdentifier:
        STANDARD_OBJECTS.opportunityContact.fields.opportunity
          .universalIdentifier,
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
  callTargets: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'callTargets',
      isSystemSideEffect: true,
      label: i18nLabel(
        msg({ message: `Calls`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Calls tied to the person`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconPhone',
      isNullable: true,
      targetObjectName: 'callTarget',
      targetFieldName: 'targetPerson',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  communicationTargets: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'communicationTargets',
      isSystemSideEffect: true,
      label: i18nLabel(
        msg({ message: `Communications`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Communications tied to the person`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMessageCircle',
      isNullable: true,
      targetObjectName: 'communicationTarget',
      targetFieldName: 'targetPerson',
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
      isSystemSideEffect: true,
      label: i18nLabel(
        msg({ message: `Logged Emails`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Emails tied to the person`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMail',
      isNullable: true,
      targetObjectName: 'emailTarget',
      targetFieldName: 'targetPerson',
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
      isSystemSideEffect: true,
      label: i18nLabel(
        msg({ message: `Logged Meetings`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Meetings tied to the person`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMail',
      isNullable: true,
      targetObjectName: 'meetingTarget',
      targetFieldName: 'targetPerson',
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
        msg({ message: `Meeting invitations`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Meetings the contact is invited to`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUsers',
      isNullable: true,
      isUIEditable: false,
      targetObjectName: 'meetingAttendee',
      targetFieldName: 'person',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  segmentMembers: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'segmentMembers',
      isSystemSideEffect: true,
      label: i18nLabel(
        msg({ message: `Segment members`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Segment memberships of the record`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconChartPie',
      isNullable: true,
      isUIEditable: false,
      targetObjectName: 'segmentMember',
      targetFieldName: 'targetPerson',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  segmentMembership: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'segmentMembership',
      type: FieldMetadataType.MULTI_SELECT,
      label: i18nLabel(
        msg({ message: `Segment Membership`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Segments the record belongs to, kept in sync from segment members`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconChartPie',
      isSystem: true,
      isNullable: true,
      isUIEditable: false,
      options: [],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  lifecycleStage: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'lifecycleStage',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Lifecycle Stage`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The qualification of contacts to sales readiness throughout the buying journey`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconProgressCheck',
      options: [
        {
          id: '35d2ae46-3dd1-40d2-b83a-cdbeddaf308c',
          value: 'NEW',
          label: i18nLabel(
            msg({ message: `New`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'gray',
        },
        {
          id: 'b84f3cb6-5b7c-4503-959e-4f4ac9ba6f91',
          value: 'LEAD',
          label: i18nLabel(
            msg({ message: `Lead`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'gray',
        },
        {
          id: '447c8280-5f02-4253-8c23-e67793490700',
          value: 'MARKETING_QUALIFIED_LEAD',
          label: i18nLabel(
            msg({
              message: `Marketing Qualified Lead`,
              context: 'fieldMetadata.label',
            }),
          ),
          position: 2,
          color: 'gray',
        },
        {
          id: '630f642f-4004-40fc-a5da-df9cba906e60',
          value: 'SALES_QUALIFIED_LEAD',
          label: i18nLabel(
            msg({
              message: `Sales Qualified Lead`,
              context: 'fieldMetadata.label',
            }),
          ),
          position: 3,
          color: 'gray',
        },
        {
          id: '97b375bd-c318-4db7-a6eb-198189a4c654',
          value: 'OPPORTUNITY',
          label: i18nLabel(
            msg({ message: `Opportunity`, context: 'fieldMetadata.label' }),
          ),
          position: 4,
          color: 'gray',
        },
        {
          id: '6c8b8ccb-b0cb-43eb-a070-c05db7e8853d',
          value: 'CUSTOMER',
          label: i18nLabel(
            msg({ message: `Customer`, context: 'fieldMetadata.label' }),
          ),
          position: 5,
          color: 'gray',
        },
        {
          id: '54d67d52-fff1-4b8f-9a5d-cbb0cc25d199',
          value: 'PROMOTER',
          label: i18nLabel(
            msg({ message: `Promoter`, context: 'fieldMetadata.label' }),
          ),
          position: 6,
          color: 'gray',
        },
        {
          id: '1ee26250-6be0-47da-8eca-01e489fca13a',
          value: 'OTHER',
          label: i18nLabel(
            msg({ message: `Other`, context: 'fieldMetadata.label' }),
          ),
          position: 7,
          color: 'gray',
        },
        {
          id: 'e9eabcbe-101b-419a-bb18-0f107806e987',
          value: 'CLOSING',
          label: i18nLabel(
            msg({ message: `Closing`, context: 'fieldMetadata.label' }),
          ),
          position: 8,
          color: 'gray',
        },
        {
          id: 'd6890bb1-6e35-424f-b7e5-19b3bf8e345d',
          value: 'ON_HOLD',
          label: i18nLabel(
            msg({ message: `On Hold`, context: 'fieldMetadata.label' }),
          ),
          position: 9,
          color: 'gray',
        },
        {
          id: '1ba17429-d059-4793-a43c-4eb3c553f4ad',
          value: 'BIN',
          label: i18nLabel(
            msg({ message: `Bin`, context: 'fieldMetadata.label' }),
          ),
          position: 10,
          color: 'gray',
        },
      ],
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  dateEnteredCurrentStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateEnteredCurrentStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date entered current stage`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact entered their current lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconClockPlay',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateEnteredNewLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateEnteredNewLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date entered 'New (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last entered the New lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarTime',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateExitedNewLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateExitedNewLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date exited 'New (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last left the New lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarX',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateEnteredLeadLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateEnteredLeadLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date entered 'Lead (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last entered the Lead lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarTime',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateExitedLeadLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateExitedLeadLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date exited 'Lead (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last left the Lead lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarX',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateEnteredMarketingQualifiedLeadLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateEnteredMarketingQualifiedLeadLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date entered 'Marketing Qualified Lead (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last entered the Marketing Qualified Lead lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarTime',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateExitedMarketingQualifiedLeadLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateExitedMarketingQualifiedLeadLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date exited 'Marketing Qualified Lead (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last left the Marketing Qualified Lead lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarX',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateEnteredSalesQualifiedLeadLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateEnteredSalesQualifiedLeadLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date entered 'Sales Qualified Lead (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last entered the Sales Qualified Lead lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarTime',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateExitedSalesQualifiedLeadLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateExitedSalesQualifiedLeadLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date exited 'Sales Qualified Lead (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last left the Sales Qualified Lead lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarX',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateEnteredOpportunityLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateEnteredOpportunityLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date entered 'Opportunity (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last entered the Opportunity lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarTime',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateExitedOpportunityLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateExitedOpportunityLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date exited 'Opportunity (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last left the Opportunity lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarX',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateEnteredCustomerLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateEnteredCustomerLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date entered 'Customer (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last entered the Customer lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarTime',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateExitedCustomerLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateExitedCustomerLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date exited 'Customer (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last left the Customer lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarX',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateEnteredPromoterLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateEnteredPromoterLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date entered 'Promoter (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last entered the Promoter lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarTime',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateExitedPromoterLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateExitedPromoterLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date exited 'Promoter (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last left the Promoter lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarX',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateEnteredOtherLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateEnteredOtherLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date entered 'Other (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last entered the Other lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarTime',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateExitedOtherLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateExitedOtherLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date exited 'Other (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last left the Other lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarX',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateEnteredClosingLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateEnteredClosingLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date entered 'Closing (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last entered the Closing lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarTime',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateExitedClosingLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateExitedClosingLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date exited 'Closing (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last left the Closing lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarX',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateEnteredOnHoldLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateEnteredOnHoldLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date entered 'On Hold (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last entered the On Hold lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarTime',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateExitedOnHoldLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateExitedOnHoldLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date exited 'On Hold (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last left the On Hold lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarX',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateEnteredBinLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateEnteredBinLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date entered 'Bin (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last entered the Bin lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarTime',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  dateExitedBinLifecycleStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dateExitedBinLifecycleStage',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Date exited 'Bin (Lifecycle Stage)'`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the contact last left the Bin lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarX',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  timeInCurrentStage: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'timeInCurrentStage',
        type: FieldMetadataType.NUMBER,
        label: i18nLabel(
          msg({
            message: `Time in current stage`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Whole days since the contact entered their current lifecycle stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconHourglass',
        isUIEditable: false,
        settings: {
          dataType: NumberDataType.INT,
        },
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  team: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'team',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Team`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The team the contact belongs to`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUsersGroup',
      options: [
        {
          id: 'b8995a85-a684-4bb4-8251-7026ababcbee',
          value: 'ACCOUNT_EXECUTIVE',
          label: i18nLabel(
            msg({
              message: `Account executive`,
              context: 'fieldMetadata.label',
            }),
          ),
          position: 0,
          color: 'gray',
        },
        {
          id: 'fa16a795-2a1d-4750-8764-8a3b03436c4a',
          value: 'MANAGEMENT',
          label: i18nLabel(
            msg({ message: `Management`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'gray',
        },
        {
          id: 'f91de6b3-4a9f-46d6-838d-efc672b834f2',
          value: 'INVESTOR',
          label: i18nLabel(
            msg({ message: `Investor`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'gray',
        },
        {
          id: 'c9ffdb28-a84b-41fc-8027-02508e34f91f',
          value: 'CRM_TEAM',
          label: i18nLabel(
            msg({ message: `CRM team`, context: 'fieldMetadata.label' }),
          ),
          position: 3,
          color: 'gray',
        },
        {
          id: 'e4a6a7d8-02f7-41c3-8def-be9eb31b9311',
          value: 'SDR',
          label: i18nLabel(
            msg({ message: `SDR`, context: 'fieldMetadata.label' }),
          ),
          position: 4,
          color: 'gray',
        },
        {
          id: '6e52a77c-8ae7-4ce8-8132-4e3b90beb112',
          value: 'PARTNERSHIPS',
          label: i18nLabel(
            msg({ message: `Partnerships`, context: 'fieldMetadata.label' }),
          ),
          position: 5,
          color: 'gray',
        },
        {
          id: 'aad2cc46-80f1-4753-8cc0-d02f1abef404',
          value: 'FINANCE',
          label: i18nLabel(
            msg({ message: `Finance`, context: 'fieldMetadata.label' }),
          ),
          position: 6,
          color: 'gray',
        },
        {
          id: '5ccb6bec-4398-44e8-a9c5-03309bb39d4d',
          value: 'ACCOUNT_MANAGERS',
          label: i18nLabel(
            msg({
              message: `Account Managers`,
              context: 'fieldMetadata.label',
            }),
          ),
          position: 7,
          color: 'gray',
        },
      ],
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  contactOwner: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'contactOwner',
      label: i18nLabel(
        msg({ message: `Contact owner`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Your team member responsible for the contact`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isNullable: true,
      targetObjectName: 'workspaceMember',
      targetFieldName: 'ownedPeople',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'contactOwnerId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  contactSdrOwner: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'contactSdrOwner',
      label: i18nLabel(
        msg({ message: `Contact SDR Owner`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The SDR responsible for the contact`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isNullable: true,
      targetObjectName: 'workspaceMember',
      targetFieldName: 'sdrOwnedPeople',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'contactSdrOwnerId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  ownerAssignedDate: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'ownerAssignedDate',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Owner assigned date`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the current contact owner was assigned`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarTime',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  sdrOwnerAssignedDate: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'sdrOwnerAssignedDate',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `SDR Owner assigned date`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the current contact SDR owner was assigned`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarTime',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  lastActivityDate: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'lastActivityDate',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Last Activity Date`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Latest call, meeting, note, task, email or communication on the contact`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarEvent',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  firstDealCreatedDate: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'firstDealCreatedDate',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `First Deal Created Date`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `When the first opportunity the contact is on was created`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconTargetArrow',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  nextActivityDate: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'nextActivityDate',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({
            message: `Next Activity Date`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Earliest upcoming meeting or open task due on the contact`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarDue',
        isUIEditable: false,
        isNullable: true,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  recordSource: createStandardRecordSourceFieldFlatMetadata({
    objectName,
    workspaceId,
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
});
