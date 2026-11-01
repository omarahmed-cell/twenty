import { FieldMetadataType, RelationType } from 'twenty-shared/types';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { getFlatFieldMetadataMock } from 'src/engine/metadata-modules/flat-field-metadata/__mocks__/get-flat-field-metadata.mock';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { getFlatObjectMetadataMock } from 'src/engine/metadata-modules/flat-object-metadata/__mocks__/get-flat-object-metadata.mock';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { resolveFieldSyncConfigs } from 'src/modules/field-sync/utils/resolve-field-sync-configs.util';

const operatesInField = getFlatFieldMetadataMock({
  id: 'operates-in',
  universalIdentifier: 'operates-in-uid',
  objectMetadataId: 'company',
  name: 'operatesIn',
  type: FieldMetadataType.MULTI_SELECT,
});

const companyNameField = getFlatFieldMetadataMock({
  id: 'company-name',
  universalIdentifier: 'company-name-uid',
  objectMetadataId: 'company',
  name: 'name',
  type: FieldMetadataType.TEXT,
});

const companyRelationField = getFlatFieldMetadataMock({
  id: 'deal-company',
  universalIdentifier: 'deal-company-uid',
  objectMetadataId: 'opportunity',
  name: 'company',
  type: FieldMetadataType.RELATION,
  relationTargetObjectMetadataId: 'company',
  settings: {
    relationType: RelationType.MANY_TO_ONE,
    joinColumnName: 'companyId',
  },
} as Partial<FlatFieldMetadata> as FlatFieldMetadata);

const dealsRelationField = getFlatFieldMetadataMock({
  id: 'company-deals',
  universalIdentifier: 'company-deals-uid',
  objectMetadataId: 'company',
  name: 'opportunities',
  type: FieldMetadataType.RELATION,
  relationTargetObjectMetadataId: 'opportunity',
  settings: { relationType: RelationType.ONE_TO_MANY },
} as Partial<FlatFieldMetadata> as FlatFieldMetadata);

const buildSyncField = (
  id: string,
  type: FieldMetadataType,
  sync: Record<string, string>,
  objectMetadataId = 'opportunity',
) =>
  getFlatFieldMetadataMock({
    id,
    universalIdentifier: `${id}-uid`,
    objectMetadataId,
    name: id,
    type,
    settings: { sync },
  } as Partial<FlatFieldMetadata> as FlatFieldMetadata);

const validSyncField = buildSyncField(
  'dealOperatesIn',
  FieldMetadataType.MULTI_SELECT,
  {
    relationFieldMetadataId: companyRelationField.id,
    sourceFieldMetadataId: operatesInField.id,
  },
);

const mismatchedTypeSyncField = buildSyncField(
  'dealOperatesInText',
  FieldMetadataType.TEXT,
  {
    relationFieldMetadataId: companyRelationField.id,
    sourceFieldMetadataId: operatesInField.id,
  },
);

const toManySyncField = buildSyncField(
  'companyDealName',
  FieldMetadataType.TEXT,
  {
    relationFieldMetadataId: dealsRelationField.id,
    sourceFieldMetadataId: companyNameField.id,
  },
  'company',
);

const fields = [
  operatesInField,
  companyNameField,
  companyRelationField,
  dealsRelationField,
  validSyncField,
  mismatchedTypeSyncField,
  toManySyncField,
];

const toMaps = <T extends FlatFieldMetadata | FlatObjectMetadata>(
  entities: T[],
) =>
  ({
    byUniversalIdentifier: Object.fromEntries(
      entities.map((entity) => [entity.universalIdentifier, entity]),
    ),
    universalIdentifierById: Object.fromEntries(
      entities.map((entity) => [entity.id, entity.universalIdentifier]),
    ),
    universalIdentifiersByApplicationId: {},
  }) as unknown as FlatEntityMaps<T>;

const flatObjectMetadataMaps = toMaps<FlatObjectMetadata>([
  getFlatObjectMetadataMock({
    id: 'company',
    universalIdentifier: 'company-uid',
    nameSingular: 'company',
    namePlural: 'companies',
  }),
  getFlatObjectMetadataMock({
    id: 'opportunity',
    universalIdentifier: 'opportunity-uid',
    nameSingular: 'opportunity',
    namePlural: 'opportunities',
  }),
]);

describe('resolveFieldSyncConfigs', () => {
  it('resolves a to-one sync and skips invalid or unsupported configs', () => {
    expect(
      resolveFieldSyncConfigs(flatObjectMetadataMaps, toMaps(fields)),
    ).toEqual([
      {
        targetFieldId: 'dealOperatesIn',
        targetFieldName: 'dealOperatesIn',
        targetObjectNameSingular: 'opportunity',
        joinColumnName: 'companyId',
        sourceObjectNameSingular: 'company',
        sourceFieldName: 'operatesIn',
        sourceFieldType: FieldMetadataType.MULTI_SELECT,
      },
    ]);
  });
});
