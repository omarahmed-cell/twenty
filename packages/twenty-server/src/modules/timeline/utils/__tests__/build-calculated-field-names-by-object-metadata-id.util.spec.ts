import { FieldMetadataType } from 'twenty-shared/types';

import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { addFlatEntityToFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/add-flat-entity-to-flat-entity-maps-or-throw.util';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { getFlatFieldMetadataMock } from 'src/engine/metadata-modules/flat-field-metadata/__mocks__/get-flat-field-metadata.mock';
import { type OrmFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/orm-flat-field-metadata.type';
import { buildCalculatedFieldNamesByObjectMetadataId } from 'src/modules/timeline/utils/build-calculated-field-names-by-object-metadata-id.util';

const COMPANY_OBJECT_METADATA_ID = 'company-object-metadata-id';

describe('buildCalculatedFieldNamesByObjectMetadataId', () => {
  it('keeps formula and non UI editable fields, nothing else', () => {
    const fields = [
      getFlatFieldMetadataMock({
        universalIdentifier: 'completion-index-field',
        objectMetadataId: COMPANY_OBJECT_METADATA_ID,
        type: FieldMetadataType.NUMBER,
        name: 'researchCompletionIndex',
        settings: {
          type: 'percentage',
          formula: { expression: 'if(isEmpty(name), 0, 1)' },
        },
      } as Parameters<typeof getFlatFieldMetadataMock>[0]),
      getFlatFieldMetadataMock({
        universalIdentifier: 'past-meetings-field',
        objectMetadataId: COMPANY_OBJECT_METADATA_ID,
        type: FieldMetadataType.NUMBER,
        name: 'numberOfPastMeetings',
        isUIEditable: false,
      } as Parameters<typeof getFlatFieldMetadataMock>[0]),
      getFlatFieldMetadataMock({
        universalIdentifier: 'name-field',
        objectMetadataId: COMPANY_OBJECT_METADATA_ID,
        type: FieldMetadataType.TEXT,
        name: 'name',
      }),
    ];
    const maps = fields.reduce(
      (flatEntityMaps, flatEntity) =>
        addFlatEntityToFlatEntityMapsOrThrow({ flatEntity, flatEntityMaps }),
      createEmptyFlatEntityMaps(),
    ) as FlatEntityMaps<OrmFlatFieldMetadata>;

    expect(
      buildCalculatedFieldNamesByObjectMetadataId(maps).get(
        COMPANY_OBJECT_METADATA_ID,
      ),
    ).toEqual(new Set(['researchCompletionIndex', 'numberOfPastMeetings']));
  });
});
