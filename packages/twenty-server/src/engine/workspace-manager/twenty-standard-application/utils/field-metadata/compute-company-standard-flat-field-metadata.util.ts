import { msg } from '@lingui/core/macro';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import {
  DateDisplayFormat,
  FieldMetadataType,
  RelationOnDeleteAction,
  MetadataWritability,
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
export const buildCompanyStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'company', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'company'>, FlatFieldMetadata> => ({
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
          message: `The company name`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconBuildingSkyscraper',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  domainName: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'domainName',
      type: FieldMetadataType.LINKS,
      label: i18nLabel(
        msg({ message: `Domain Name`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The company website URL. We use this url to fetch the company icon`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconLink',
      isNullable: true,
      isUnique: true,
      settings: {
        maxNumberOfValues: 1,
        type: 'domain',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  address: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'address',
      type: FieldMetadataType.ADDRESS,
      label: i18nLabel(
        msg({ message: `Address`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Address of the company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMap',
      isNullable: true,
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
          message: `The company Linkedin account`,
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
  annualRevenue: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'annualRevenue',
      type: FieldMetadataType.CURRENCY,
      label: i18nLabel(
        msg({ message: `Annual Revenue`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The company's total annual revenue`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMoneybag',
      isNullable: true,
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
          message: `Company record position`,
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

  people: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'people',
      label: i18nLabel(
        msg({ message: `Contacts`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `People linked to the company.`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUsers',
      isNullable: true,
      targetObjectName: 'person',
      targetFieldName: 'company',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  accountOwner: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'accountOwner',
      label: i18nLabel(
        msg({ message: `Account Owner`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Your team member responsible for managing the company account`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isNullable: true,
      targetObjectName: 'workspaceMember',
      targetFieldName: 'accountOwnerForCompanies',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'accountOwnerId',
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
          message: `Tasks tied to the company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.taskTarget
        .icon,
      isNullable: true,
      targetObjectName: 'taskTarget',
      targetFieldName: 'targetCompany',
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
          message: `Notes tied to the company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.noteTarget
        .icon,
      isNullable: true,
      targetObjectName: 'noteTarget',
      targetFieldName: 'targetCompany',
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
          message: `Chats tied to the company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT
        .agentChatThreadTarget.icon,
      isUIEditable: false,
      isNullable: true,
      targetObjectName: 'agentChatThreadTarget',
      targetFieldName: 'targetCompany',
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
          message: `Calendar events tied to the company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendar',
      isUIEditable: false,
      isNullable: true,
      targetObjectName: 'calendarEventTarget',
      targetFieldName: 'targetCompany',
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
          message: `Message threads tied to the company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMail',
      isUIEditable: false,
      isNullable: true,
      targetObjectName: 'messageThreadTarget',
      targetFieldName: 'targetCompany',
      settings: { relationType: RelationType.ONE_TO_MANY },
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
          message: `Opportunities linked to the company.`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconTargetArrow',
      isNullable: true,
      targetObjectName: 'opportunity',
      targetFieldName: 'company',
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
          message: `Services linked to the company.`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconBriefcase',
      isNullable: true,
      targetObjectName: 'service',
      targetFieldName: 'company',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  parentCompany: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'parentCompany',
      label: i18nLabel(
        msg({ message: `Parent company`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Parent company of this company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconBuildingSkyscraper',
      isNullable: true,
      targetObjectName: 'company',
      targetFieldName: 'childCompanies',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'parentCompanyId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  childCompanies: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'childCompanies',
      label: i18nLabel(
        msg({ message: `Child companies`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Child companies of this company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconBuildingSkyscraper',
      isNullable: true,
      targetObjectName: 'company',
      targetFieldName: 'parentCompany',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
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
          message: `Attachments linked to the company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.attachment
        .icon,
      isNullable: true,
      targetObjectName: 'attachment',
      targetFieldName: 'targetCompany',
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
          message: `Timeline Activities linked to the company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT
        .timelineActivity.icon,
      isNullable: true,
      targetObjectName: 'timelineActivity',
      targetFieldName: 'targetCompany',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
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
          message: `Calls tied to the company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconPhone',
      isNullable: true,
      targetObjectName: 'callTarget',
      targetFieldName: 'targetCompany',
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
          message: `Communications tied to the company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMessageCircle',
      isNullable: true,
      targetObjectName: 'communicationTarget',
      targetFieldName: 'targetCompany',
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
          message: `Emails tied to the company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMail',
      isNullable: true,
      targetObjectName: 'emailTarget',
      targetFieldName: 'targetCompany',
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
      targetFieldName: 'targetCompany',
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
  isParentCompany: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'isParentCompany',
        type: FieldMetadataType.BOOLEAN,
        label: i18nLabel(
          msg({ message: `Is Parent company`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({
            message: `True when the company has at least one direct child company`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconHierarchy2',
        isUIEditable: false,
        isNullable: false,
        defaultValue: false,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  isChildCompany: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'isChildCompany',
        type: FieldMetadataType.BOOLEAN,
        label: i18nLabel(
          msg({ message: `Is Child company`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({
            message: `True when the company has a parent company`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconHierarchy',
        isUIEditable: false,
        isNullable: false,
        defaultValue: false,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  numberOfChildCompanies: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'numberOfChildCompanies',
        type: FieldMetadataType.NUMBER,
        label: i18nLabel(
          msg({
            message: `Number of child companies`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Number of direct child companies`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconNumber',
        isUIEditable: false,
        isNullable: false,
        defaultValue: 0,
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
            message: `Number of people linked to the company`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconUsers',
        isUIEditable: false,
        isNullable: false,
        defaultValue: 0,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  numberOfAssociatedDeals: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'numberOfAssociatedDeals',
        type: FieldMetadataType.NUMBER,
        label: i18nLabel(
          msg({
            message: `Number of Associated Deals`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Number of opportunities linked to the company`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconTargetArrow',
        isUIEditable: false,
        isNullable: false,
        defaultValue: 0,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  numberOfOpenDeals: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'numberOfOpenDeals',
        type: FieldMetadataType.NUMBER,
        label: i18nLabel(
          msg({
            message: `Number of open deals`,
            context: 'fieldMetadata.label',
          }),
        ),
        description: i18nLabel(
          msg({
            message: `Number of opportunities linked to the company whose stage is open`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconTarget',
        isUIEditable: false,
        isNullable: false,
        defaultValue: 0,
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
            message: `Latest call, meeting, note, task, email or communication on the company, its people or its opportunities`,
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
          message: `The qualification of companies to sales readiness throughout the buying journey`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconProgressCheck',
      isNullable: true,
      options: [
        {
          id: '969f1d4a-ff22-471e-9d83-d50f91869801',
          value: 'NEW',
          label: i18nLabel(
            msg({ message: `New`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'gray',
        },
        {
          id: '49c2d8a5-56ab-42cc-bc68-d6d836f608eb',
          value: 'LEAD',
          label: i18nLabel(
            msg({ message: `Lead`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'gray',
        },
        {
          id: '4dc283e9-0c6a-4a47-8006-f30e3edc646c',
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
          id: '9c598b02-cd64-456f-a713-51cf808957b5',
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
          id: 'a0dfb9df-feea-4c22-b24c-c529d4ec032d',
          value: 'OPPORTUNITY',
          label: i18nLabel(
            msg({ message: `Opportunity`, context: 'fieldMetadata.label' }),
          ),
          position: 4,
          color: 'gray',
        },
        {
          id: 'a66a063a-1003-409f-af59-bf9b672a21b6',
          value: 'CUSTOMER',
          label: i18nLabel(
            msg({ message: `Customer`, context: 'fieldMetadata.label' }),
          ),
          position: 5,
          color: 'gray',
        },
        {
          id: '7dd98b4c-89f8-49f5-aa7a-bc10c593a2f6',
          value: 'PROMOTER',
          label: i18nLabel(
            msg({ message: `Promoter`, context: 'fieldMetadata.label' }),
          ),
          position: 6,
          color: 'gray',
        },
        {
          id: 'd43c50f8-421a-42b4-8960-ab3c14712da1',
          value: 'OTHER',
          label: i18nLabel(
            msg({ message: `Other`, context: 'fieldMetadata.label' }),
          ),
          position: 7,
          color: 'gray',
        },
        {
          id: '2588a500-63af-4a67-b662-030ba2d6af9a',
          value: 'CLOSING',
          label: i18nLabel(
            msg({ message: `Closing`, context: 'fieldMetadata.label' }),
          ),
          position: 8,
          color: 'gray',
        },
        {
          id: 'cc42d3d2-d74b-4963-b27a-3bf8a00fb240',
          value: 'ON_HOLD',
          label: i18nLabel(
            msg({ message: `On Hold`, context: 'fieldMetadata.label' }),
          ),
          position: 9,
          color: 'gray',
        },
        {
          id: 'ce47f785-f1b4-46da-bff6-cf0ba6f6257d',
          value: 'BIN',
          label: i18nLabel(
            msg({ message: `Bin`, context: 'fieldMetadata.label' }),
          ),
          position: 10,
          color: 'gray',
        },
      ],
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
            message: `When the company entered its current lifecycle stage`,
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
            message: `When the company last entered the New lifecycle stage`,
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
            message: `When the company last left the New lifecycle stage`,
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
            message: `When the company last entered the Lead lifecycle stage`,
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
            message: `When the company last left the Lead lifecycle stage`,
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
            message: `When the company last entered the Marketing Qualified Lead lifecycle stage`,
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
            message: `When the company last left the Marketing Qualified Lead lifecycle stage`,
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
            message: `When the company last entered the Sales Qualified Lead lifecycle stage`,
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
            message: `When the company last left the Sales Qualified Lead lifecycle stage`,
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
            message: `When the company last entered the Opportunity lifecycle stage`,
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
            message: `When the company last left the Opportunity lifecycle stage`,
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
            message: `When the company last entered the Customer lifecycle stage`,
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
            message: `When the company last left the Customer lifecycle stage`,
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
            message: `When the company last entered the Promoter lifecycle stage`,
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
            message: `When the company last left the Promoter lifecycle stage`,
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
            message: `When the company last entered the Other lifecycle stage`,
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
            message: `When the company last left the Other lifecycle stage`,
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
            message: `When the company last entered the Closing lifecycle stage`,
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
            message: `When the company last left the Closing lifecycle stage`,
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
            message: `When the company last entered the On Hold lifecycle stage`,
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
            message: `When the company last left the On Hold lifecycle stage`,
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
            message: `When the company last entered the Bin lifecycle stage`,
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
            message: `When the company last left the Bin lifecycle stage`,
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
            message: `When the current company owner was assigned`,
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
  sdrOwner: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'sdrOwner',
      label: i18nLabel(
        msg({ message: `Company SDR Owner`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The SDR Responsible for this Company`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconRelationOneToMany',
      isNullable: true,
      targetObjectName: 'workspaceMember',
      targetFieldName: 'sdrOwnedCompanies',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'sdrOwnerId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
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
            message: `When the current company SDR owner was assigned`,
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
            message: `Earliest upcoming meeting or open task due on the company, its people or its deals`,
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
});
