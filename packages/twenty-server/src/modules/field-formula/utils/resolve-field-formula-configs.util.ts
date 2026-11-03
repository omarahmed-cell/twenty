import { isNonEmptyString } from '@sniptt/guards';
import {
  type FieldMetadataFormulaSettings,
  FieldMetadataType,
} from 'twenty-shared/types';
import {
  FORMULA_OUTPUT_FIELD_TYPES,
  type FormulaOutputFieldType,
  findComputedFieldCycleMembers,
  isDefined,
  isPlainObject,
  parseFormula,
} from 'twenty-shared/utils';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type ResolvedFieldFormulaConfig } from 'src/modules/field-formula/types/resolved-field-formula-config.type';

const FIELD_TYPES_WITHOUT_A_VALUE = new Set<FieldMetadataType>([
  FieldMetadataType.RELATION,
  FieldMetadataType.MORPH_RELATION,
  FieldMetadataType.TS_VECTOR,
]);

// updatedAt is excluded from record diffs, so a formula on it would silently go stale.
const FIELD_NAMES_NOT_REFERENCEABLE = new Set(['updatedAt']);

const isFormulaOutputFieldType = (
  type: FieldMetadataType,
): type is FormulaOutputFieldType =>
  (FORMULA_OUTPUT_FIELD_TYPES as readonly FieldMetadataType[]).includes(type);

export const getFieldFormulaSettings = (
  field: Pick<FlatFieldMetadata, 'type' | 'settings'>,
): FieldMetadataFormulaSettings | undefined => {
  if (!isFormulaOutputFieldType(field.type) || !isPlainObject(field.settings)) {
    return undefined;
  }

  const formula = (field.settings as { formula?: unknown }).formula;

  return isPlainObject(formula) && isNonEmptyString(formula.expression)
    ? (formula as FieldMetadataFormulaSettings)
    : undefined;
};

const resolveFieldFormulaConfig = (
  targetField: FlatFieldMetadata,
  objectFields: FlatFieldMetadata[],
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>,
): ResolvedFieldFormulaConfig | undefined => {
  const formula = getFieldFormulaSettings(targetField);

  if (
    !isDefined(formula) ||
    !targetField.isActive ||
    !isFormulaOutputFieldType(targetField.type)
  ) {
    return undefined;
  }

  const parsedFormula = parseFormula(formula.expression);

  if (parsedFormula.status === 'invalid') {
    return undefined;
  }

  const dependencies = parsedFormula.fieldNames.map((fieldName) =>
    objectFields.find(
      (field) =>
        field.name === fieldName &&
        field.isActive &&
        field.id !== targetField.id &&
        !FIELD_TYPES_WITHOUT_A_VALUE.has(field.type) &&
        !FIELD_NAMES_NOT_REFERENCEABLE.has(field.name),
    ),
  );

  if (!dependencies.every(isDefined)) {
    return undefined;
  }

  const targetObject = findFlatEntityByIdInFlatEntityMaps({
    flatEntityId: targetField.objectMetadataId,
    flatEntityMaps: flatObjectMetadataMaps,
  });

  if (!isDefined(targetObject)) {
    return undefined;
  }

  return {
    targetFieldId: targetField.id,
    targetFieldName: targetField.name,
    outputType: targetField.type,
    objectNameSingular: targetObject.nameSingular,
    expression: formula.expression,
    dependencies: dependencies.map(({ id, name, type }) => ({
      fieldId: id,
      name,
      type,
    })),
  };
};

// Formulas on the same object are evaluated in this order, so each one reads its
// dependencies' fresh values. Loop members were already excluded, so this terminates.
const sortByDependencies = (configs: ResolvedFieldFormulaConfig[]) => {
  const configByFieldId = new Map(
    configs.map((config) => [config.targetFieldId, config]),
  );
  const visited = new Set<string>();
  const sorted: ResolvedFieldFormulaConfig[] = [];

  const visit = (config: ResolvedFieldFormulaConfig) => {
    if (visited.has(config.targetFieldId)) {
      return;
    }

    visited.add(config.targetFieldId);

    for (const { fieldId } of config.dependencies) {
      const dependency = configByFieldId.get(fieldId);

      if (isDefined(dependency)) {
        visit(dependency);
      }
    }

    sorted.push(config);
  };

  configs.forEach(visit);

  return sorted;
};

const configsCache = new WeakMap<
  FlatEntityMaps<FlatFieldMetadata>,
  ResolvedFieldFormulaConfig[]
>();

// Flat maps are immutable per metadata version, so the resolved list is memoized by identity.
export const resolveFieldFormulaConfigs = (
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>,
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>,
): ResolvedFieldFormulaConfig[] => {
  const cachedConfigs = configsCache.get(flatFieldMetadataMaps);

  if (isDefined(cachedConfigs)) {
    return cachedConfigs;
  }

  const fields = Object.values(
    flatFieldMetadataMaps.byUniversalIdentifier,
  ).filter(isDefined);

  const cycleMembers = findComputedFieldCycleMembers(fields);

  const configs = fields
    .filter(
      (field) =>
        isDefined(getFieldFormulaSettings(field)) &&
        !cycleMembers.has(field.id),
    )
    .map((field) =>
      resolveFieldFormulaConfig(
        field,
        fields.filter(
          ({ objectMetadataId }) => objectMetadataId === field.objectMetadataId,
        ),
        flatObjectMetadataMaps,
      ),
    )
    .filter(isDefined);

  const sortedConfigs = sortByDependencies(configs);

  configsCache.set(flatFieldMetadataMaps, sortedConfigs);

  return sortedConfigs;
};
