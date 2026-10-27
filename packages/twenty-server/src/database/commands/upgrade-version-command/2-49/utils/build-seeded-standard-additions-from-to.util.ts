import { isDefined } from 'twenty-shared/utils';

import {
  ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS,
  type ActivityObjectsFlatEntities,
  type ActivityObjectsFlatEntityMaps,
  collectParentReferences,
} from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { selectStandardAdditionsFromSeeds } from 'src/database/commands/upgrade-version-command/2-49/utils/select-standard-additions-from-seeds.util';
import { type SyncableFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FromToAllUniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';

const addFlatEntities = <T extends SyncableFlatEntity>(
  flatEntityMaps: FlatEntityMaps<T>,
  flatEntities: T[],
): FlatEntityMaps<T> =>
  flatEntities.reduce(
    (maps, flatEntity) => ({
      byUniversalIdentifier: {
        ...maps.byUniversalIdentifier,
        [flatEntity.universalIdentifier]: flatEntity,
      },
      universalIdentifierById: {
        ...maps.universalIdentifierById,
        [flatEntity.id]: flatEntity.universalIdentifier,
      },
      universalIdentifiersByApplicationId: {
        ...maps.universalIdentifiersByApplicationId,
        [flatEntity.applicationId]: Array.from(
          new Set([
            ...(maps.universalIdentifiersByApplicationId[
              flatEntity.applicationId
            ] ?? []),
            flatEntity.universalIdentifier,
          ]),
        ),
      },
    }),
    flatEntityMaps,
  );

const removeFlatEntities = <T extends SyncableFlatEntity>(
  flatEntityMaps: FlatEntityMaps<T>,
  universalIdentifiers: Set<string>,
): FlatEntityMaps<T> => ({
  byUniversalIdentifier: Object.fromEntries(
    Object.entries(flatEntityMaps.byUniversalIdentifier).filter(
      ([universalIdentifier]) => !universalIdentifiers.has(universalIdentifier),
    ),
  ),
  universalIdentifierById: Object.fromEntries(
    Object.entries(flatEntityMaps.universalIdentifierById).filter(
      ([, universalIdentifier]) =>
        !isDefined(universalIdentifier) ||
        !universalIdentifiers.has(universalIdentifier),
    ),
  ),
  universalIdentifiersByApplicationId: Object.fromEntries(
    Object.entries(flatEntityMaps.universalIdentifiersByApplicationId).map(
      ([applicationId, applicationUniversalIdentifiers]) => [
        applicationId,
        (applicationUniversalIdentifiers ?? []).filter(
          (universalIdentifier) =>
            !universalIdentifiers.has(universalIdentifier),
        ),
      ],
    ),
  ),
});

export const countSeededStandardAdditions = (
  additions: ActivityObjectsFlatEntities,
) =>
  Object.values(additions).reduce(
    (total, flatEntities) => total + flatEntities.length,
    0,
  );

// The standard entities the seeds bring in that the workspace lacks, as an additive from/to migration
export const buildSeededStandardAdditionsFromTo = ({
  existing,
  standard,
  seedUniversalIdentifiers,
}: {
  existing: ActivityObjectsFlatEntityMaps;
  standard: ActivityObjectsFlatEntityMaps;
  seedUniversalIdentifiers: string[];
}): {
  additions: ActivityObjectsFlatEntities;
  fromToAllFlatEntityMaps: FromToAllUniversalFlatEntityMaps;
} => {
  const { additions } = selectStandardAdditionsFromSeeds({
    existing,
    standard,
    seedUniversalIdentifiers,
  });

  return {
    additions,
    fromToAllFlatEntityMaps: Object.fromEntries(
      ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
        mapsKey,
        {
          from: existing[mapsKey],
          to: addFlatEntities(
            existing[mapsKey] as FlatEntityMaps<SyncableFlatEntity>,
            additions[mapsKey] as SyncableFlatEntity[],
          ),
        },
      ]),
    ) as FromToAllUniversalFlatEntityMaps,
  };
};

// Everything the seeds bring in, plus whatever in the workspace points at it
export const buildSeededStandardRollbackFromTo = ({
  existing,
  standard,
  seedUniversalIdentifiers,
}: {
  existing: ActivityObjectsFlatEntityMaps;
  standard: ActivityObjectsFlatEntityMaps;
  seedUniversalIdentifiers: string[];
}): FromToAllUniversalFlatEntityMaps => {
  const emptyMaps = Object.fromEntries(
    ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
      mapsKey,
      {
        byUniversalIdentifier: {},
        universalIdentifierById: {},
        universalIdentifiersByApplicationId: {},
      },
    ]),
  ) as unknown as ActivityObjectsFlatEntityMaps;

  const { additions } = selectStandardAdditionsFromSeeds({
    existing: emptyMaps,
    standard,
    seedUniversalIdentifiers,
  });

  const universalIdentifiersToRemove = new Set(
    Object.values(additions)
      .flat()
      .map((flatEntity) => flatEntity.universalIdentifier),
  );

  let hasChanged = true;

  while (hasChanged) {
    hasChanged = false;

    for (const mapsKey of ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS) {
      for (const flatEntity of Object.values(
        existing[mapsKey].byUniversalIdentifier,
      ).filter(isDefined)) {
        if (
          !universalIdentifiersToRemove.has(flatEntity.universalIdentifier) &&
          collectParentReferences(flatEntity).some((reference) =>
            universalIdentifiersToRemove.has(reference),
          )
        ) {
          universalIdentifiersToRemove.add(flatEntity.universalIdentifier);
          hasChanged = true;
        }
      }
    }
  }

  return Object.fromEntries(
    ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
      mapsKey,
      {
        from: existing[mapsKey],
        to: removeFlatEntities(
          existing[mapsKey] as FlatEntityMaps<SyncableFlatEntity>,
          universalIdentifiersToRemove,
        ),
      },
    ]),
  ) as FromToAllUniversalFlatEntityMaps;
};
