import { msg } from '@lingui/core/macro';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { buildPipelineSelectOptions } from 'twenty-shared/utils';
import { PIPELINE_SEED } from 'twenty-shared/constants';
import {
  DateDisplayFormat,
  FieldMetadataType,
  MetadataWritability,
  NumberDataType,
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
import { createStandardRelationFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-relation-field-flat-metadata.util';
const SEEDED_PIPELINE_SELECT_OPTIONS = buildPipelineSelectOptions({
  pipelines: PIPELINE_SEED.map((pipeline) => ({
    key: pipeline.key,
    name: pipeline.name,
    stages: pipeline.stages.map(({ value, label }) => ({
      value,
      label,
      color: null,
    })),
  })),
  pipelineFieldUniversalIdentifier:
    STANDARD_OBJECTS.opportunity.fields.pipeline.universalIdentifier,
  stageFieldUniversalIdentifier:
    STANDARD_OBJECTS.opportunity.fields.stage.universalIdentifier,
});

export const buildOpportunityStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'opportunity', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'opportunity'>, FlatFieldMetadata> => ({
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

  name: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'name',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Name`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The opportunity name`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconTargetArrow',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  amount: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'amount',
      type: FieldMetadataType.CURRENCY,
      label: i18nLabel(
        msg({ message: `Amount`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Opportunity amount`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCurrencyDollar',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  closeDate: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'closeDate',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Close date`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Opportunity close date`,
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
  stage: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'stage',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Deal Stage`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Opportunity stage`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconProgressCheck',
      isNullable: false,
      defaultValue: `'${SEEDED_PIPELINE_SELECT_OPTIONS.defaultStageValue}'`,
      options: SEEDED_PIPELINE_SELECT_OPTIONS.stageOptions,
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
          message: `Opportunity record position`,
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

  pointOfContact: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'pointOfContact',
      label: i18nLabel(
        msg({ message: `Point of Contact`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Opportunity point of contact`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUser',
      isNullable: true,
      targetObjectName: 'person',
      targetFieldName: 'pointOfContactForOpportunities',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'pointOfContactId',
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
          message: `Opportunity company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconBuildingSkyscraper',
      isNullable: true,
      targetObjectName: 'company',
      targetFieldName: 'opportunities',
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
          message: `Services linked to the opportunity`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconBriefcase',
      isNullable: true,
      targetObjectName: 'service',
      targetFieldName: 'opportunity',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  lineItems: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'lineItems',
      label: i18nLabel(
        msg({ message: `Line of Item`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Products sold on the deal`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconListNumbers',
      isNullable: true,
      targetObjectName: 'lineItem',
      targetFieldName: 'deal',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  contacts: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'contacts',
      label: i18nLabel(
        msg({ message: `Contacts`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Contacts on the deal`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUser',
      isUIEditable: true,
      isNullable: true,
      targetObjectName: 'opportunityContact',
      targetFieldName: 'opportunity',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
      junctionTargetFieldUniversalIdentifier:
        STANDARD_OBJECTS.opportunityContact.fields.person.universalIdentifier,
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
          message: `Tasks tied to the opportunity`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.taskTarget
        .icon,
      isNullable: true,
      targetObjectName: 'taskTarget',
      targetFieldName: 'targetOpportunity',
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
          message: `Notes tied to the opportunity`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.noteTarget
        .icon,
      isNullable: true,
      targetObjectName: 'noteTarget',
      targetFieldName: 'targetOpportunity',
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
          message: `Chats tied to the opportunity`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT
        .agentChatThreadTarget.icon,
      isUIEditable: false,
      isNullable: true,
      targetObjectName: 'agentChatThreadTarget',
      targetFieldName: 'targetOpportunity',
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
          message: `Calendar events tied to the opportunity`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendar',
      isUIEditable: false,
      isNullable: true,
      targetObjectName: 'calendarEventTarget',
      targetFieldName: 'targetOpportunity',
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
          message: `Message threads tied to the opportunity`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMail',
      isUIEditable: false,
      isNullable: true,
      targetObjectName: 'messageThreadTarget',
      targetFieldName: 'targetOpportunity',
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
          message: `Attachments linked to the opportunity`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.attachment
        .icon,
      isNullable: true,
      targetObjectName: 'attachment',
      targetFieldName: 'targetOpportunity',
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
        STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.timelineActivity
          .label,
      ),
      description: i18nLabel(
        msg({
          message: `Timeline Activities linked to the opportunity.`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT
        .timelineActivity.icon,
      isNullable: true,
      targetObjectName: 'timelineActivity',
      targetFieldName: 'targetOpportunity',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  owner: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'owner',
      label: i18nLabel(
        msg({ message: `Owner`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Opportunity owner`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isNullable: true,
      targetObjectName: 'workspaceMember',
      targetFieldName: 'ownedOpportunities',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'ownerId',
      },
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
          message: `Calls tied to the opportunity`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconPhone',
      isNullable: true,
      targetObjectName: 'callTarget',
      targetFieldName: 'targetOpportunity',
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
          message: `Communications tied to the opportunity`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMessageCircle',
      isNullable: true,
      targetObjectName: 'communicationTarget',
      targetFieldName: 'targetOpportunity',
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
        msg({ message: `Emails`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Emails tied to the opportunity`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMail',
      isNullable: true,
      targetObjectName: 'emailTarget',
      targetFieldName: 'targetOpportunity',
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
      targetFieldName: 'targetOpportunity',
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
          message: `The team the deal belongs to`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUsersGroup',
      options: [
        {
          id: '622a2cf9-f2ac-4ade-bb20-38a60b5d2ddf',
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
          id: '11b985e3-45b2-44dd-b5d7-1a85e5cfa61c',
          value: 'MANAGEMENT',
          label: i18nLabel(
            msg({ message: `Management`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'gray',
        },
        {
          id: 'c70b8154-49b6-4de0-a769-9d5f578ef64a',
          value: 'INVESTOR',
          label: i18nLabel(
            msg({ message: `Investor`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'gray',
        },
        {
          id: 'd0f409c3-7496-443b-bdc5-56f29830cea5',
          value: 'CRM_TEAM',
          label: i18nLabel(
            msg({ message: `CRM team`, context: 'fieldMetadata.label' }),
          ),
          position: 3,
          color: 'gray',
        },
        {
          id: 'ee70b9f5-1291-4814-b118-2d8532019601',
          value: 'SDR',
          label: i18nLabel(
            msg({ message: `SDR`, context: 'fieldMetadata.label' }),
          ),
          position: 4,
          color: 'gray',
        },
        {
          id: 'e30e94e1-8c6e-4d10-b8aa-0d8694fb0c25',
          value: 'PARTNERSHIPS',
          label: i18nLabel(
            msg({ message: `Partnerships`, context: 'fieldMetadata.label' }),
          ),
          position: 5,
          color: 'gray',
        },
        {
          id: '2f2111f3-8898-47f1-94a5-4d136c894c4b',
          value: 'FINANCE',
          label: i18nLabel(
            msg({ message: `Finance`, context: 'fieldMetadata.label' }),
          ),
          position: 6,
          color: 'gray',
        },
        {
          id: '12494829-d728-4cc2-abd0-ea96fcb59642',
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
  dealCollaborators: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'dealCollaborators',
      label: i18nLabel(
        msg({ message: `Deal collaborators`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Workspace members collaborating on the deal`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUsers',
      isUIEditable: true,
      isNullable: true,
      targetObjectName: 'opportunityCollaborator',
      targetFieldName: 'opportunity',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
      junctionTargetFieldUniversalIdentifier:
        STANDARD_OBJECTS.opportunityCollaborator.fields.workspaceMember
          .universalIdentifier,
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
            message: `When the current deal owner was assigned`,
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
            message: `Latest call, meeting, note, task, email or communication on the deal`,
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
  numberOfAssociatedContacts: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'numberOfAssociatedContacts',
        type: FieldMetadataType.NUMBER,
        label: i18nLabel(
          msg({
            message: `Number of Associated Contacts`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Distinct people on the deal, point of contact included`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconUsers',
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
  numberOfAssociatedLineItems: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'numberOfAssociatedLineItems',
        type: FieldMetadataType.NUMBER,
        label: i18nLabel(
          msg({
            message: `Number of Associated Line Items`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Line items on the deal`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconListNumbers',
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
            message: `Earliest upcoming meeting or open task due on the deal`,
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
  pipeline: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'pipeline',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Pipeline`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The pipeline the deal moves through`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconTimelineEvent',
      isNullable: false,
      defaultValue: `'${SEEDED_PIPELINE_SELECT_OPTIONS.defaultPipelineValue}'`,
      options: SEEDED_PIPELINE_SELECT_OPTIONS.pipelineOptions,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  dealProbability: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'dealProbability',
        type: FieldMetadataType.NUMBER,
        label: i18nLabel(
          msg({
            message: `Deal probability`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `The probability of the deal stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconPercentage',
        isUIEditable: false,
        settings: {
          dataType: NumberDataType.FLOAT,
          type: 'percentage',
          decimals: 0,
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
  weightedAmount: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'weightedAmount',
        type: FieldMetadataType.CURRENCY,
        label: i18nLabel(
          msg({
            message: `Weighted amount`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Amount times the stage probability, in the currency of Amount`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCoins',
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
  isClosed: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'isClosed',
        type: FieldMetadataType.BOOLEAN,
        label: i18nLabel(
          msg({
            message: `Is Deal Closed?`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Whether the deal stage is won or lost`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCircleCheck',
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
  isClosedWon: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'isClosedWon',
        type: FieldMetadataType.BOOLEAN,
        label: i18nLabel(
          msg({
            message: `Is Closed Won`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Whether the deal stage has a probability of 100`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconTrophy',
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
  isClosedLost: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'isClosedLost',
        type: FieldMetadataType.BOOLEAN,
        label: i18nLabel(
          msg({
            message: `Is closed lost`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Whether the deal stage has a probability of 0`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCircleX',
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
  isOpen: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'isOpen',
        type: FieldMetadataType.BOOLEAN,
        label: i18nLabel(
          msg({
            message: `Is Open`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Whether the deal stage is neither won nor lost`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCircleDot',
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
  actualDuration: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'actualDuration',
        type: FieldMetadataType.NUMBER,
        label: i18nLabel(
          msg({
            message: `Actual duration`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Whole days from creation to Close Date, once the deal is closed`,
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
  stageHistory: {
    // Stage changes are bookkeeping for the stage date fields, not something to browse on the deal
    ...createStandardRelationFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        type: FieldMetadataType.RELATION,
        morphId: null,
        fieldName: 'stageHistory',
        label: i18nLabel(
          msg({ message: `Stage history`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({
            message: `Every stage change of the deal`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconTimelineEvent',
        isNullable: true,
        isUIEditable: false,
        targetObjectName: 'opportunityStageHistory',
        targetFieldName: 'opportunity',
        settings: {
          relationType: RelationType.ONE_TO_MANY,
        },
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    isSystem: true,
  },
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
            message: `When the deal last entered its current stage`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarClock',
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
            message: `Days in the current stage, including earlier stays in it`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconHourglass',
        isUIEditable: false,
        settings: {
          dataType: NumberDataType.FLOAT,
          decimals: 1,
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
});
