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

export const buildLineItemStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'lineItem', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'lineItem'>, FlatFieldMetadata> => ({
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
          message: `Line item record position`,
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
  product: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'product',
      label: i18nLabel(
        msg({ message: `Product`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The product sold on this line`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconPackage',
      isNullable: true,
      targetObjectName: 'product',
      targetFieldName: 'lineItems',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'productId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  deal: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'deal',
      label: i18nLabel(
        msg({ message: `Deal`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The deal this line belongs to`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconTargetArrow',
      isNullable: true,
      targetObjectName: 'opportunity',
      targetFieldName: 'lineItems',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'dealId',
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
          message: `Copied from the selected product`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconListNumbers',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  term: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'term',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Term (months)`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Contract term in months`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarTime',
      isNullable: true,
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
  billingFrequency: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'billingFrequency',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Billing frequency`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `How often this line is billed`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarRepeat',
      isNullable: true,
      options: [
        {
          id: '03028411-2cf5-47e8-ab12-558d5ea3ced4',
          value: 'ONE_TIME',
          label: i18nLabel(
            msg({ message: `One-time`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'green',
        },
        {
          id: '9b0db8e3-d711-4a08-a2c2-ba0bcb7612ef',
          value: 'WEEKLY',
          label: i18nLabel(
            msg({ message: `Weekly`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'turquoise',
        },
        {
          id: 'e06d5e12-c377-406e-ab0f-65fff357f5bc',
          value: 'EVERY_TWO_WEEKS',
          label: i18nLabel(
            msg({ message: `Every two weeks`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'sky',
        },
        {
          id: '92f7f75c-3ff2-4cdd-b401-5b655b3b7c1a',
          value: 'MONTHLY',
          label: i18nLabel(
            msg({ message: `Monthly`, context: 'fieldMetadata.label' }),
          ),
          position: 3,
          color: 'blue',
        },
        {
          id: '067dde0d-3cfb-499b-8324-b9bf65107ef4',
          value: 'QUARTERLY',
          label: i18nLabel(
            msg({ message: `Quarterly`, context: 'fieldMetadata.label' }),
          ),
          position: 4,
          color: 'purple',
        },
        {
          id: '74bf9016-2cf0-43be-bd41-9b103b96eace',
          value: 'SEMI_ANNUALLY',
          label: i18nLabel(
            msg({ message: `Semi-annually`, context: 'fieldMetadata.label' }),
          ),
          position: 5,
          color: 'pink',
        },
        {
          id: '326facc6-1bf2-412f-a23a-ebbfde6e0af5',
          value: 'ANNUALLY',
          label: i18nLabel(
            msg({ message: `Annually`, context: 'fieldMetadata.label' }),
          ),
          position: 6,
          color: 'red',
        },
        {
          id: '637b4b6f-5770-443a-99b8-864f954f88bd',
          value: 'EVERY_TWO_YEARS',
          label: i18nLabel(
            msg({ message: `Every two years`, context: 'fieldMetadata.label' }),
          ),
          position: 7,
          color: 'orange',
        },
        {
          id: '8133bd76-ce24-4e18-b242-fe1ce5cad899',
          value: 'EVERY_THREE_YEARS',
          label: i18nLabel(
            msg({
              message: `Every three years`,
              context: 'fieldMetadata.label',
            }),
          ),
          position: 8,
          color: 'yellow',
        },
        {
          id: 'c7297ba4-0da5-49e9-ad32-db6fb59b370e',
          value: 'EVERY_FOUR_YEARS',
          label: i18nLabel(
            msg({
              message: `Every four years`,
              context: 'fieldMetadata.label',
            }),
          ),
          position: 9,
          color: 'gray',
        },
        {
          id: '2a74370e-f6a8-4a84-8443-85fda148a6ef',
          value: 'EVERY_FIVE_YEARS',
          label: i18nLabel(
            msg({
              message: `Every five years`,
              context: 'fieldMetadata.label',
            }),
          ),
          position: 10,
          color: 'green',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  quantity: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'quantity',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Quantity`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Number of units`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconHash',
      isNullable: true,
      settings: {
        dataType: NumberDataType.FLOAT,
        decimals: 0,
        type: 'number',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  unitPrice: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'unitPrice',
      type: FieldMetadataType.CURRENCY,
      label: i18nLabel(
        msg({ message: `Unit price`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Price of one unit on this line`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCurrencyDollar',
      isNullable: true,
      defaultValue: { amountMicros: null, currencyCode: "'USD'" },
      settings: {
        format: 'full',
        decimals: 2,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  unitDiscount: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'unitDiscount',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Unit discount`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Discount applied to each unit, as a percentage`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconDiscount',
      isNullable: true,
      settings: {
        dataType: NumberDataType.FLOAT,
        decimals: 0,
        type: 'percentage',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  totalPrice: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'totalPrice',
      type: FieldMetadataType.CURRENCY,
      label: i18nLabel(
        msg({ message: `Total price`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Unit price x quantity, less the unit discount`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalculator',
      isNullable: true,
      isUIEditable: false,
      defaultValue: { amountMicros: null, currencyCode: "'USD'" },
      settings: {
        format: 'full',
        decimals: 2,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
});
