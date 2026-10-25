import { msg } from '@lingui/core/macro';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import {
  DateDisplayFormat,
  FieldMetadataType,
  RelationType,
} from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import {
  type CreateStandardFieldArgs,
  createStandardFieldFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { createStandardRelationFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-relation-field-flat-metadata.util';

export const buildProductStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'product', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'product'>, FlatFieldMetadata> => ({
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
          message: `Product record position`,
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
          message: `The product name`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconPackage',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  sku: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'sku',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(msg({ message: `SKU`, context: 'fieldMetadata.label' })),
      description: i18nLabel(
        msg({
          message: `The product stock keeping unit`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconBarcode',
      isNullable: true,
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
        msg({
          message: `The product description`,
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
  productType: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'productType',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Product type`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Whether the product is stocked, non-stocked or a service`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconTag',
      isNullable: true,
      options: [
        {
          id: '6dd6d2ab-4096-4a59-a976-5d69846314e7',
          value: 'INVENTORY',
          label: i18nLabel(
            msg({ message: `Inventory`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'green',
        },
        {
          id: 'eccc913e-c904-4b17-a4e4-ce177fe0facf',
          value: 'NON_INVENTORY',
          label: i18nLabel(
            msg({ message: `Non-Inventory`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'turquoise',
        },
        {
          id: 'e209f968-2eb1-477f-a8b0-e293ae76ed7b',
          value: 'SERVICE',
          label: i18nLabel(
            msg({ message: `Service`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'sky',
        },
      ],
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
          message: `How often the product is billed`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarRepeat',
      isNullable: true,
      options: [
        {
          id: 'fbf7075a-38e4-4e8d-803b-05f17501bfa0',
          value: 'ONE_TIME',
          label: i18nLabel(
            msg({ message: `One-time`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'green',
        },
        {
          id: '3a92a118-2664-49cf-a14b-cda38f2f0199',
          value: 'WEEKLY',
          label: i18nLabel(
            msg({ message: `Weekly`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'turquoise',
        },
        {
          id: '9c3d0afe-5020-4479-9572-3a16fc2f8732',
          value: 'EVERY_TWO_WEEKS',
          label: i18nLabel(
            msg({ message: `Every two weeks`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'sky',
        },
        {
          id: 'dc95d94f-5e5c-4198-a1cf-fb09c53e0835',
          value: 'MONTHLY',
          label: i18nLabel(
            msg({ message: `Monthly`, context: 'fieldMetadata.label' }),
          ),
          position: 3,
          color: 'blue',
        },
        {
          id: '34b1290d-abe8-46df-9ef4-c90fd3f690c9',
          value: 'QUARTERLY',
          label: i18nLabel(
            msg({ message: `Quarterly`, context: 'fieldMetadata.label' }),
          ),
          position: 4,
          color: 'purple',
        },
        {
          id: '15319916-6c97-48d6-b409-9c048ca43967',
          value: 'SEMI_ANNUALLY',
          label: i18nLabel(
            msg({ message: `Semi-annually`, context: 'fieldMetadata.label' }),
          ),
          position: 5,
          color: 'pink',
        },
        {
          id: '667dbbca-28f1-4fd5-8529-ef14777ea92b',
          value: 'ANNUALLY',
          label: i18nLabel(
            msg({ message: `Annually`, context: 'fieldMetadata.label' }),
          ),
          position: 6,
          color: 'red',
        },
        {
          id: 'cf211438-3418-45e3-8e9a-33b9cfc5cd08',
          value: 'EVERY_TWO_YEARS',
          label: i18nLabel(
            msg({ message: `Every two years`, context: 'fieldMetadata.label' }),
          ),
          position: 7,
          color: 'orange',
        },
        {
          id: '0a476fbe-2126-4784-901f-2079b735c300',
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
          id: 'c6320760-a49e-4a80-92a1-8a66ad0875ec',
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
          id: 'fc617488-df9c-4f55-8c13-7d5e949a8e63',
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
          message: `The price of one unit`,
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
  unitCost: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'unitCost',
      type: FieldMetadataType.CURRENCY,
      label: i18nLabel(
        msg({ message: `Unit cost`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The cost of one unit`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconReceipt',
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
  lineItems: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'lineItems',
      label: i18nLabel(
        msg({ message: `Line Items`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Deal line items using this product`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconListNumbers',
      isNullable: true,
      targetObjectName: 'lineItem',
      targetFieldName: 'product',
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
