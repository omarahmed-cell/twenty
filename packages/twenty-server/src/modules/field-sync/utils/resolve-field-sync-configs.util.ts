import { isNonEmptyString } from '@sniptt/guards';
import {
  FIELD_SYNC_POLICIES,
  type FieldMetadataSyncSettings,
  FieldMetadataType,
  RelationType,
} from 'twenty-shared/types';
import {
  findComputedFieldCycleMembers,
  getFieldSyncTargetFieldType,
  isDefined,
  isPlainObject,
} from 'twenty-shared/utils';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import {
  type FieldSyncCardinality,
  type ResolvedFieldSyncConfig,
} from 'src/modules/field-sync/types/resolved-field-sync-config.type';

const SYNC_TARGET_FIELD_TYPES = new Set<FieldMetadataType>([
  FieldMetadataType.TEXT,
  FieldMetadataType.SELECT,
  FieldMetadataType.MULTI_SELECT,
]);

export const getFieldSyncSettings = (
  field: Pick<FlatFieldMetadata, 'type' | 'settings'>,
): FieldMetadataSyncSettings | undefined => {
  if (
    !SYNC_TARGET_FIELD_TYPES.has(field.type) ||
    !isPlainObject(field.settings)
  ) {
    return undefined;
  }

  const sync = (field.settings as { sync?: unknown }).sync;

  if (
    !isPlainObject(sync) ||
    !isNonEmptyString(sync.relationFieldMetadataId) ||
    !isNonEmptyString(sync.sourceFieldMetadataId)
  ) {
    return undefined;
  }

  return sync as FieldMetadataSyncSettings;
};

type RelationSettings =
  | { relationType?: RelationType; joinColumnName?: string | null }
  | null
  | undefined;

const getRelationSettings = (field: FlatFieldMetadata | undefined) =>
  field?.type === FieldMetadataType.RELATION
    ? (field.settings as RelationSettings)
    : undefined;

const resolveCardinality = (
  relationField: FlatFieldMetadata,
  sync: FieldMetadataSyncSettings,
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>,
): FieldSyncCardinality | undefined => {
  const relationSettings = getRelationSettings(relationField);

  if (relationSettings?.relationType === RelationType.MANY_TO_ONE) {
    return isNonEmptyString(relationSettings.joinColumnName)
      ? {
          cardinality: 'TO_ONE',
          joinColumnName: relationSettings.joinColumnName,
        }
      : undefined;
  }

  if (relationSettings?.relationType !== RelationType.ONE_TO_MANY) {
    return undefined;
  }

  const inverseField = isDefined(relationField.relationTargetFieldMetadataId)
    ? findFlatEntityByIdInFlatEntityMaps({
        flatEntityId: relationField.relationTargetFieldMetadataId,
        flatEntityMaps: flatFieldMetadataMaps,
      })
    : undefined;

  const inverseSettings = getRelationSettings(inverseField);

  if (
    inverseSettings?.relationType !== RelationType.MANY_TO_ONE ||
    !isNonEmptyString(inverseSettings.joinColumnName)
  ) {
    return undefined;
  }

  return {
    cardinality: 'TO_MANY',
    sourceJoinColumnName: inverseSettings.joinColumnName,
    policy:
      isDefined(sync.policy) && FIELD_SYNC_POLICIES.includes(sync.policy)
        ? sync.policy
        : 'MOST_RECENTLY_CREATED',
  };
};

const resolveFieldSyncConfig = (
  targetField: FlatFieldMetadata,
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>,
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>,
): ResolvedFieldSyncConfig | undefined => {
  const sync = getFieldSyncSettings(targetField);

  if (!isDefined(sync) || !targetField.isActive) {
    return undefined;
  }

  const relationField = findFlatEntityByIdInFlatEntityMaps({
    flatEntityId: sync.relationFieldMetadataId,
    flatEntityMaps: flatFieldMetadataMaps,
  });

  if (
    !isDefined(relationField) ||
    !relationField.isActive ||
    relationField.objectMetadataId !== targetField.objectMetadataId ||
    !isDefined(relationField.relationTargetObjectMetadataId)
  ) {
    return undefined;
  }

  const cardinality = resolveCardinality(
    relationField,
    sync,
    flatFieldMetadataMaps,
  );

  if (!isDefined(cardinality)) {
    return undefined;
  }

  const sourceField = findFlatEntityByIdInFlatEntityMaps({
    flatEntityId: sync.sourceFieldMetadataId,
    flatEntityMaps: flatFieldMetadataMaps,
  });

  if (
    !isDefined(sourceField) ||
    !sourceField.isActive ||
    sourceField.objectMetadataId !==
      relationField.relationTargetObjectMetadataId ||
    isDefined(getFieldSyncSettings(sourceField)) ||
    getFieldSyncTargetFieldType(sourceField.type) !== targetField.type
  ) {
    return undefined;
  }

  const targetObject = findFlatEntityByIdInFlatEntityMaps({
    flatEntityId: targetField.objectMetadataId,
    flatEntityMaps: flatObjectMetadataMaps,
  });

  const sourceObject = findFlatEntityByIdInFlatEntityMaps({
    flatEntityId: sourceField.objectMetadataId,
    flatEntityMaps: flatObjectMetadataMaps,
  });

  if (!isDefined(targetObject) || !isDefined(sourceObject)) {
    return undefined;
  }

  return {
    targetFieldId: targetField.id,
    targetFieldName: targetField.name,
    targetObjectNameSingular: targetObject.nameSingular,
    relationFieldId: relationField.id,
    sourceObjectNameSingular: sourceObject.nameSingular,
    sourceFieldId: sourceField.id,
    sourceFieldName: sourceField.name,
    sourceFieldType: sourceField.type,
    ...cardinality,
  };
};

const configsCache = new WeakMap<
  FlatEntityMaps<FlatFieldMetadata>,
  ResolvedFieldSyncConfig[]
>();

// Flat maps are immutable per metadata version, so the resolved list is memoized by identity.
export const resolveFieldSyncConfigs = (
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>,
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>,
): ResolvedFieldSyncConfig[] => {
  const cachedConfigs = configsCache.get(flatFieldMetadataMaps);

  if (isDefined(cachedConfigs)) {
    return cachedConfigs;
  }

  const fields = Object.values(
    flatFieldMetadataMaps.byUniversalIdentifier,
  ).filter(isDefined);

  const cycleMembers = findComputedFieldCycleMembers(fields);

  const configs = fields
    .filter((field) => !cycleMembers.has(field.id))
    .map((field) =>
      resolveFieldSyncConfig(
        field,
        flatObjectMetadataMaps,
        flatFieldMetadataMaps,
      ),
    )
    .filter(isDefined);

  configsCache.set(flatFieldMetadataMaps, configs);

  return configs;
};
