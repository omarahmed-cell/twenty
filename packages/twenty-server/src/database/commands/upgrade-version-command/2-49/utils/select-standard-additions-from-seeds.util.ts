import { isDefined } from 'twenty-shared/utils';

import {
  ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS,
  type ActivityObjectsFlatEntities,
  type ActivityObjectsFlatEntityMaps,
  type ActivityObjectsFlatEntityMapsKey,
  collectParentReferences,
} from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';

type LooseFlatEntity = Record<string, unknown> & {
  id: string;
  universalIdentifier: string;
};

const getEntities = (flatEntityMaps: {
  byUniversalIdentifier: Partial<Record<string, unknown>>;
}): LooseFlatEntity[] =>
  Object.values(flatEntityMaps.byUniversalIdentifier).filter(
    isDefined,
  ) as LooseFlatEntity[];

// Everything in the standard definitions that points, directly or transitively, at the seed
// entities; a new tab on an existing layout comes in through its widget
export const selectStandardAdditionsFromSeeds = ({
  existing,
  standard,
  seedUniversalIdentifiers,
}: {
  existing: ActivityObjectsFlatEntityMaps;
  standard: ActivityObjectsFlatEntityMaps;
  seedUniversalIdentifiers: string[];
}): {
  additions: ActivityObjectsFlatEntities;
  droppedTabUniversalIdentifiers: string[];
  droppedWidgetUniversalIdentifiers: string[];
} => {
  const isExisting = (
    mapsKey: ActivityObjectsFlatEntityMapsKey,
    universalIdentifier: string,
  ) => isDefined(existing[mapsKey].byUniversalIdentifier[universalIdentifier]);

  const standardByMapsKey = Object.fromEntries(
    ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
      mapsKey,
      getEntities(standard[mapsKey]),
    ]),
  ) as Record<ActivityObjectsFlatEntityMapsKey, LooseFlatEntity[]>;

  const missingByMapsKey = Object.fromEntries(
    ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
      mapsKey,
      standardByMapsKey[mapsKey].filter(
        (entity) => !isExisting(mapsKey, entity.universalIdentifier),
      ),
    ]),
  ) as Record<ActivityObjectsFlatEntityMapsKey, LooseFlatEntity[]>;

  const selected = new Set<string>();
  // Standard ids are only consistent within the standard maps, so they are tracked apart
  const selectedReferences = new Set<string>();

  const select = (entity: LooseFlatEntity) => {
    selected.add(entity.universalIdentifier);
    selectedReferences.add(entity.universalIdentifier);
    selectedReferences.add(entity.id);
  };

  for (const universalIdentifier of seedUniversalIdentifiers) {
    const seedEntity = ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map(
      (mapsKey) => standard[mapsKey].byUniversalIdentifier[universalIdentifier],
    ).find(isDefined) as LooseFlatEntity | undefined;

    if (isDefined(seedEntity)) {
      select(seedEntity);
    }
  }

  let hasChanged = true;

  while (hasChanged) {
    hasChanged = false;

    for (const mapsKey of ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS) {
      for (const entity of standardByMapsKey[mapsKey]) {
        if (
          !selected.has(entity.universalIdentifier) &&
          collectParentReferences(entity).some((reference) =>
            selectedReferences.has(reference),
          )
        ) {
          select(entity);
          hasChanged = true;
        }
      }
    }

    // A new tab on an existing layout is reached through its widget, without its other widgets
    for (const widget of standardByMapsKey.flatPageLayoutWidgetMaps) {
      const tabUniversalIdentifier =
        widget.pageLayoutTabUniversalIdentifier as string;

      const missingTab = missingByMapsKey.flatPageLayoutTabMaps.find(
        (tab) => tab.universalIdentifier === tabUniversalIdentifier,
      );

      if (
        selected.has(widget.universalIdentifier) &&
        isDefined(missingTab) &&
        !selected.has(tabUniversalIdentifier)
      ) {
        selected.add(missingTab.universalIdentifier);
        hasChanged = true;
      }
    }
  }

  const droppedTabUniversalIdentifiers = missingByMapsKey.flatPageLayoutTabMaps
    .filter(
      (tab) =>
        selected.has(tab.universalIdentifier) &&
        !selected.has(tab.pageLayoutUniversalIdentifier as string) &&
        !isExisting(
          'flatPageLayoutMaps',
          tab.pageLayoutUniversalIdentifier as string,
        ),
    )
    .map((tab) => tab.universalIdentifier);

  const droppedWidgetUniversalIdentifiers =
    missingByMapsKey.flatPageLayoutWidgetMaps
      .filter(
        (widget) =>
          selected.has(widget.universalIdentifier) &&
          droppedTabUniversalIdentifiers.includes(
            widget.pageLayoutTabUniversalIdentifier as string,
          ),
      )
      .map((widget) => widget.universalIdentifier);

  for (const universalIdentifier of [
    ...droppedTabUniversalIdentifiers,
    ...droppedWidgetUniversalIdentifiers,
  ]) {
    selected.delete(universalIdentifier);
  }

  const additions = Object.fromEntries(
    ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
      mapsKey,
      missingByMapsKey[mapsKey].filter((entity) =>
        selected.has(entity.universalIdentifier),
      ),
    ]),
  ) as unknown as ActivityObjectsFlatEntities;

  return {
    additions,
    droppedTabUniversalIdentifiers,
    droppedWidgetUniversalIdentifiers,
  };
};
