import { msg } from '@lingui/core/macro';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import {
  DateDisplayFormat,
  MetadataWritability,
  FieldMetadataType,
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
export const buildEmailTrackingEventStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'emailTrackingEvent', FieldMetadataType>,
  'context'
>): Record<
  AllStandardObjectFieldName<'emailTrackingEvent'>,
  FlatFieldMetadata
> => ({
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
          message: `Deal stage change record position`,
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
  email: {
    ...createStandardRelationFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        type: FieldMetadataType.RELATION,
        morphId: null,
        fieldName: 'email',
        label: i18nLabel(
          msg({ message: `Email`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({
            message: `The tracked email`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconMail',
        isNullable: false,
        isUIEditable: false,
        targetObjectName: 'email',
        targetFieldName: 'trackingEvents',
        settings: {
          relationType: RelationType.MANY_TO_ONE,
          onDelete: RelationOnDeleteAction.CASCADE,
          joinColumnName: 'emailId',
        },
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  type: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'type',
        type: FieldMetadataType.SELECT,
        label: i18nLabel(
          msg({ message: `Type`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({
            message: `Open or link click`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCategory',
        isNullable: false,
        isUIEditable: false,
        options: [
          {
            id: '5a613f91-bfb5-419b-9878-a73651813b34',
            value: 'OPEN',
            label: i18nLabel(
              msg({ message: `Open`, context: 'fieldMetadata.label' }),
            ),
            position: 0,
            color: 'green',
          },
          {
            id: 'a6e689f7-0499-4425-b444-a4b4a58a83c6',
            value: 'CLICK',
            label: i18nLabel(
              msg({ message: `Click`, context: 'fieldMetadata.label' }),
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
    writability: MetadataWritability.SYSTEM,
  },
  url: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'url',
        type: FieldMetadataType.TEXT,
        label: i18nLabel(
          msg({ message: `URL`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({
            message: `Clicked link`,
            context: 'fieldMetadata.description',
          }),
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
    writability: MetadataWritability.SYSTEM,
  },
  occurredAt: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'occurredAt',
        type: FieldMetadataType.DATE_TIME,
        label: i18nLabel(
          msg({ message: `Occurred at`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({
            message: `When the open or click happened`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCalendarClock',
        isNullable: false,
        isUIEditable: false,
        defaultValue: 'now',
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  userAgent: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'userAgent',
        type: FieldMetadataType.TEXT,
        label: i18nLabel(
          msg({ message: `User agent`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({
            message: `Browser or mail proxy that made the request`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconDeviceDesktop',
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
  isProxy: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'isProxy',
        type: FieldMetadataType.BOOLEAN,
        label: i18nLabel(
          msg({ message: `Is proxy`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({
            message: `Fetched by a mail image proxy (Gmail, Apple Mail Privacy Protection)`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconShieldCheck',
        isNullable: false,
        isUIEditable: false,
        defaultValue: false,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  isSender: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'isSender',
        type: FieldMetadataType.BOOLEAN,
        label: i18nLabel(
          msg({ message: `Is sender`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({
            message: `Made by the sending rep`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconUserCheck',
        isNullable: false,
        isUIEditable: false,
        defaultValue: false,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
  isCounted: {
    ...createStandardFieldFlatMetadata({
      objectName,
      workspaceId,
      context: {
        fieldName: 'isCounted',
        type: FieldMetadataType.BOOLEAN,
        label: i18nLabel(
          msg({ message: `Is counted`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({
            message: `Counted in the email totals`,
            context: 'fieldMetadata.description',
          }),
        ),
        icon: 'IconCheck',
        isNullable: false,
        isUIEditable: false,
        defaultValue: false,
      },
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
      now,
    }),
    writability: MetadataWritability.SYSTEM,
  },
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
});
