import { isDefined } from 'twenty-shared/utils';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type OrmFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/orm-flat-field-metadata.type';
import { getFieldFormulaSettings } from 'src/modules/field-formula/utils/resolve-field-formula-configs.util';

export const isCalculatedFlatFieldMetadata = (
  flatFieldMetadata: OrmFlatFieldMetadata,
): boolean =>
  isDefined(getFieldFormulaSettings(flatFieldMetadata)) ||
  flatFieldMetadata.isUIEditable === false;

export const buildCalculatedFieldNamesByObjectMetadataId = (
  flatFieldMetadataMaps: FlatEntityMaps<OrmFlatFieldMetadata>,
): Map<string, Set<string>> => {
  const calculatedFieldNamesByObjectMetadataId = new Map<string, Set<string>>();

  for (const flatFieldMetadata of Object.values(
    flatFieldMetadataMaps.byUniversalIdentifier,
  )) {
    if (
      !isDefined(flatFieldMetadata) ||
      !isCalculatedFlatFieldMetadata(flatFieldMetadata)
    ) {
      continue;
    }

    const calculatedFieldNames =
      calculatedFieldNamesByObjectMetadataId.get(
        flatFieldMetadata.objectMetadataId,
      ) ?? new Set<string>();

    calculatedFieldNames.add(flatFieldMetadata.name);
    calculatedFieldNamesByObjectMetadataId.set(
      flatFieldMetadata.objectMetadataId,
      calculatedFieldNames,
    );
  }

  return calculatedFieldNamesByObjectMetadataId;
};
