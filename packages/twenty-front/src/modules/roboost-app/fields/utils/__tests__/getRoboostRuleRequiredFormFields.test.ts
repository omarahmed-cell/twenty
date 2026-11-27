import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostRuleRequiredFormFields } from '@/roboost-app/fields/utils/getRoboostRuleRequiredFormFields';
import {
  type ConditionalLogicField,
  type ConditionalLogicRule,
} from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const buildField = (name: string, type: FieldMetadataType) =>
  ({
    id: `${name}-id`,
    name,
    label: name,
    type,
    isActive: true,
    isSystem: false,
  }) as unknown as FieldMetadataItem;

const nameField = buildField('name', FieldMetadataType.TEXT);
const productsField = buildField('products', FieldMetadataType.MULTI_SELECT);
const branchesField = buildField('noOfBranches', FieldMetadataType.NUMBER);

const objectMetadataItem = {
  nameSingular: 'company',
  fields: [nameField, productsField, branchesField],
} as unknown as EnrichedObjectMetadataItem;

const fields: ConditionalLogicField[] = [
  { name: 'name', label: 'Name', type: FieldMetadataType.TEXT },
  { name: 'products', label: 'Products', type: FieldMetadataType.MULTI_SELECT },
  {
    name: 'noOfBranches',
    label: 'No. of Branches',
    type: FieldMetadataType.NUMBER,
  },
];

const rules: ConditionalLogicRule[] = [
  {
    id: 'rule',
    conditionGroups: [
      {
        id: 'group',
        conditions: [
          {
            id: 'condition',
            fieldName: 'products',
            operator: 'CONTAINS_ANY_OF',
            value: ['SIRA'],
          },
        ],
      },
    ],
    properties: [{ fieldName: 'noOfBranches', isRequired: true }],
  },
];

const formFields = [
  { field: nameField, isRequired: true },
  { field: productsField, isRequired: false },
];

describe('getRoboostRuleRequiredFormFields', () => {
  it('keeps the form as configured, without dependents, while no rule is true', () => {
    const result = getRoboostRuleRequiredFormFields({
      formFields,
      objectMetadataItem,
      values: { products: ['RIVET'] },
      rules,
      fields,
    });

    expect(result.map(({ field }) => field.name)).toEqual(['name', 'products']);
  });

  it('adds the required field right under the field that triggered it', () => {
    const result = getRoboostRuleRequiredFormFields({
      formFields: [...formFields].reverse(),
      objectMetadataItem,
      values: { products: ['SIRA'] },
      rules,
      fields,
    });

    expect(result.map(({ field }) => field.name)).toEqual([
      'products',
      'noOfBranches',
      'name',
    ]);
    expect(result[1]).toMatchObject({
      isRequired: true,
      dependentOfFieldName: 'products',
    });
  });

  it('moves a dependent already on the form under its trigger', () => {
    const result = getRoboostRuleRequiredFormFields({
      formFields: [{ field: branchesField, isRequired: false }, ...formFields],
      objectMetadataItem,
      values: { products: ['SIRA'] },
      rules,
      fields,
    });

    expect(result.map(({ field }) => field.name)).toEqual([
      'name',
      'products',
      'noOfBranches',
    ]);
    expect(result[2]).toMatchObject({
      isRequired: true,
      dependentOfFieldName: 'products',
    });
  });
});
