import { isNonEmptyString } from '@sniptt/guards';
import {
  type FieldMetadataSyncSettings,
  FieldMetadataType,
  RelationType,
} from 'twenty-shared/types';
import {
  getFieldSyncTargetFieldType,
  isDefined,
  isPlainObject,
} from 'twenty-shared/utils';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type ResolvedFieldSyncConfig } from 'src/modules/field-sync/types/resolved-field-sync-config.type';

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

  const relationSettings = relationField?.settings as
    | { relationType?: RelationType; joinColumnName?: string | null }
    | null
    | undefined;

  if (
    !isDefined(relationField) ||
    relationField.objectMetadataId !== targetField.objectMetadataId ||
    relationField.type !== FieldMetadataType.RELATION ||
    relationSettings?.relationType !== RelationType.MANY_TO_ONE ||
    !isNonEmptyString(relationSettings.joinColumnName) ||
    !isDefined(relationField.relationTargetObjectMetadataId)
  ) {
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
    joinColumnName: relationSettings.joinColumnName,
    sourceObjectNameSingular: sourceObject.nameSingular,
    sourceFieldName: sourceField.name,
    sourceFieldType: sourceField.type,
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

  const configs = Object.values(flatFieldMetadataMaps.byUniversalIdentifier)
    .filter(isDefined)
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
