import { msg } from '@lingui/core/macro';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import {
  DateDisplayFormat,
  FieldMetadataType,
  NumberDataType,
  RelationOnDeleteAction,
  RelationType,
} from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import {
  type CreateStandardFieldArgs,
  createStandardFieldFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { createStandardRelationFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-relation-field-flat-metadata.util';

export const buildSegmentStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'segment', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'segment'>, FlatFieldMetadata> => ({
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
          message: `Segment record position`,
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
          message: `The segment name`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconChartPie',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  targetObject: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'targetObject',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Target object`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The kind of records the segment holds`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconBox',
      isNullable: true,
      options: [
        {
          id: '4a3fbefa-6c9d-4cb4-9b11-0967e9ac8848',
          value: 'COMPANY',
          label: i18nLabel(
            msg({ message: `Company`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'blue',
        },
        {
          id: '6bda5f85-d37e-4669-9505-68ecdd0b64a1',
          value: 'PERSON',
          label: i18nLabel(
            msg({ message: `Contact`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'green',
        },
        {
          id: 'e598ec56-0b1f-4dcf-b595-5b749c46df78',
          value: 'OPPORTUNITY',
          label: i18nLabel(
            msg({ message: `Deal`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'red',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  memberCount: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'memberCount',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Size`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Number of records in the segment`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUsersGroup',
      isNullable: false,
      isUIEditable: false,
      defaultValue: 0,
      settings: {
        dataType: NumberDataType.INT,
        decimals: 0,
        type: 'number',
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
      label: i18nLabel(
        msg({ message: `Members`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Records in the segment`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUsersGroup',
      isNullable: true,
      isUIEditable: false,
      targetObjectName: 'segmentMember',
      targetFieldName: 'segment',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  pulledFrom: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'pulledFrom',
      label: i18nLabel(
        msg({ message: `Pulled from`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Segment whose associated records fill this segment`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconArrowMerge',
      isNullable: true,
      isUIEditable: false,
      targetObjectName: 'segment',
      targetFieldName: 'pulledSegments',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'pulledFromId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  pulledSegments: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'pulledSegments',
      label: i18nLabel(
        msg({ message: `Pulled segments`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Segments filled from this segment's associated records`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconArrowMerge',
      isNullable: true,
      isUIEditable: false,
      targetObjectName: 'segment',
      targetFieldName: 'pulledFrom',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  pullRelationFieldMetadataId: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'pullRelationFieldMetadataId',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Pull relation`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Relation followed from the source segment's records`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconArrowMerge',
      isSystem: true,
      isNullable: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
});
