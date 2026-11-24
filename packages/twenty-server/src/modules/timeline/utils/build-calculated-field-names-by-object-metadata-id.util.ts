import { isDefined } from 'twenty-shared/utils';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type OrmFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/orm-flat-field-metadata.type';
import { getFieldFormulaSettings } from 'src/modules/field-formula/utils/resolve-field-formula-configs.util';

// System fields (updatedBy, updatedAt...) are bookkeeping, never a property with its own history
export const isCalculatedFlatFieldMetadata = (
  flatFieldMetadata: OrmFlatFieldMetadata,
): boolean =>
  flatFieldMetadata.isSystem !== true &&
  (isDefined(getFieldFormulaSettings(flatFieldMetadata)) ||
    flatFieldMetadata.isUIEditable === false);

const buildFieldNamesByObjectMetadataId = (
  flatFieldMetadataMaps: FlatEntityMaps<OrmFlatFieldMetadata>,
  isIncluded: (flatFieldMetadata: OrmFlatFieldMetadata) => boolean,
): Map<string, Set<string>> => {
  const fieldNamesByObjectMetadataId = new Map<string, Set<string>>();

  for (const flatFieldMetadata of Object.values(
    flatFieldMetadataMaps.byUniversalIdentifier,
  )) {
    if (!isDefined(flatFieldMetadata) || !isIncluded(flatFieldMetadata)) {
      continue;
    }

    const fieldNames =
      fieldNamesByObjectMetadataId.get(flatFieldMetadata.objectMetadataId) ??
      new Set<string>();

    fieldNames.add(flatFieldMetadata.name);
    fieldNamesByObjectMetadataId.set(
      flatFieldMetadata.objectMetadataId,
      fieldNames,
    );
  }

  return fieldNamesByObjectMetadataId;
};

export const buildCalculatedFieldNamesByObjectMetadataId = (
  flatFieldMetadataMaps: FlatEntityMaps<OrmFlatFieldMetadata>,
) =>
  buildFieldNamesByObjectMetadataId(
    flatFieldMetadataMaps,
    isCalculatedFlatFieldMetadata,
  );

export const buildSystemFieldNamesByObjectMetadataId = (
  flatFieldMetadataMaps: FlatEntityMaps<OrmFlatFieldMetadata>,
) =>
  buildFieldNamesByObjectMetadataId(
    flatFieldMetadataMaps,
    (flatFieldMetadata) => flatFieldMetadata.isSystem === true,
  );
