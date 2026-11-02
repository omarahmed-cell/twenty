import { FieldMetadataType } from 'twenty-shared/types';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { getFlatFieldMetadataMock } from 'src/engine/metadata-modules/flat-field-metadata/__mocks__/get-flat-field-metadata.mock';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { getFlatObjectMetadataMock } from 'src/engine/metadata-modules/flat-object-metadata/__mocks__/get-flat-object-metadata.mock';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { resolveFieldFormulaConfigs } from 'src/modules/field-formula/utils/resolve-field-formula-configs.util';

const buildField = (
  name: string,
  type: FieldMetadataType,
  overrides: Record<string, unknown> = {},
) =>
  getFlatFieldMetadataMock({
    id: name,
    universalIdentifier: `${name}-uid`,
    objectMetadataId: 'opportunity',
    name,
    type,
    isActive: true,
    ...overrides,
  } as Partial<FlatFieldMetadata> as FlatFieldMetadata);

const buildFormulaField = (
  name: string,
  expression: string,
  overrides: Record<string, unknown> = {},
) =>
  buildField(name, FieldMetadataType.NUMBER, {
    settings: { formula: { expression } },
    ...overrides,
  });

const toMaps = <TEntity extends FlatFieldMetadata | FlatObjectMetadata>(
  entities: TEntity[],
) =>
  ({
    byUniversalIdentifier: Object.fromEntries(
      entities.map((entity) => [entity.universalIdentifier, entity]),
    ),
    universalIdentifierById: Object.fromEntries(
      entities.map((entity) => [entity.id, entity.universalIdentifier]),
    ),
    universalIdentifiersByApplicationId: {},
  }) as unknown as FlatEntityMaps<TEntity>;

const OBJECT_MAPS = toMaps<FlatObjectMetadata>([
  getFlatObjectMetadataMock({
    id: 'opportunity',
    universalIdentifier: 'opportunity-uid',
    nameSingular: 'opportunity',
    namePlural: 'opportunities',
  }),
]);

const BASE_FIELDS = [
  buildField('price', FieldMetadataType.NUMBER),
  buildField('branches', FieldMetadataType.NUMBER),
  buildField('company', FieldMetadataType.RELATION),
  buildField('updatedAt', FieldMetadataType.DATE_TIME),
  buildField('inactive', FieldMetadataType.NUMBER, { isActive: false }),
  buildField('otherObject', FieldMetadataType.NUMBER, {
    objectMetadataId: 'company',
  }),
];

const resolveNames = (...fields: FlatFieldMetadata[]) =>
  resolveFieldFormulaConfigs(
    OBJECT_MAPS,
    toMaps([...BASE_FIELDS, ...fields]),
  ).map(({ targetFieldName }) => targetFieldName);

describe('resolveFieldFormulaConfigs', () => {
  it('resolves a valid formula with its dependencies', () => {
    const [config] = resolveFieldFormulaConfigs(
      OBJECT_MAPS,
      toMaps([...BASE_FIELDS, buildFormulaField('total', 'price * branches')]),
    );

    expect(config).toEqual({
      targetFieldId: 'total',
      targetFieldName: 'total',
      outputType: FieldMetadataType.NUMBER,
      objectNameSingular: 'opportunity',
      expression: 'price * branches',
      dependencies: [
        { fieldId: 'price', name: 'price', type: FieldMetadataType.NUMBER },
        {
          fieldId: 'branches',
          name: 'branches',
          type: FieldMetadataType.NUMBER,
        },
      ],
    });
  });

  it.each([
    ['a syntax error', 'price *'],
    ['an unknown field', 'price * nope'],
    ['an inactive field', 'price * inactive'],
    ['a relation', 'price * company'],
    ['updatedAt', 'daysBetween(updatedAt, price)'],
    ['a field of another object', 'price * otherObject'],
    ['itself', 'total + 1'],
  ])('pauses a formula that references %s', (_label, expression) => {
    expect(resolveNames(buildFormulaField('total', expression))).toEqual([]);
  });

  it('pauses an inactive formula field', () => {
    expect(
      resolveNames(
        buildFormulaField('total', 'price * 2', { isActive: false }),
      ),
    ).toEqual([]);
  });

  it('does not treat formula settings on an unsupported type as a formula', () => {
    expect(
      resolveNames(
        buildField('total', FieldMetadataType.RATING, {
          settings: { formula: { expression: 'price' } },
        }),
      ),
    ).toEqual([]);
  });

  it('holds formula-on-formula references until ordering exists', () => {
    expect(
      resolveNames(
        buildFormulaField('first', 'price * 2'),
        buildFormulaField('second', 'first + 1'),
      ),
    ).toEqual(['first']);
  });
});
