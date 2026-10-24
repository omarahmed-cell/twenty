import {
  STANDARD_OBJECT_FIELDS,
  STANDARD_OBJECTS,
} from 'twenty-shared/metadata';
import { WidgetType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type AllFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-maps.type';

export const ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS = [
  'flatObjectMetadataMaps',
  'flatFieldMetadataMaps',
  'flatIndexMaps',
  'flatSearchFieldMetadataMaps',
  'flatViewMaps',
  'flatViewFieldGroupMaps',
  'flatViewFieldMaps',
  'flatViewFilterMaps',
  'flatViewGroupMaps',
  'flatPageLayoutMaps',
  'flatPageLayoutTabMaps',
  'flatPageLayoutWidgetMaps',
  'flatCommandMenuItemMaps',
  'flatNavigationMenuItemMaps',
  'flatTimelineActivityTypeMaps',
] as const satisfies (keyof AllFlatEntityMaps)[];

export type ActivityObjectsFlatEntityMapsKey =
  (typeof ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS)[number];

export type ActivityObjectsFlatEntityMaps = Pick<
  AllFlatEntityMaps,
  ActivityObjectsFlatEntityMapsKey
>;

export type ActivityObjectsFlatEntities = {
  [TKey in ActivityObjectsFlatEntityMapsKey]: NonNullable<
    ActivityObjectsFlatEntityMaps[TKey]['byUniversalIdentifier'][string]
  >[];
};

export const ACTIVITY_OBJECT_UNIVERSAL_IDENTIFIERS: string[] = [
  STANDARD_OBJECTS.service.universalIdentifier,
  STANDARD_OBJECTS.call.universalIdentifier,
  STANDARD_OBJECTS.callTarget.universalIdentifier,
  STANDARD_OBJECTS.communication.universalIdentifier,
  STANDARD_OBJECTS.communicationTarget.universalIdentifier,
];

// The only fork additions that point at no activity object, so the reference walk cannot reach them
const SEED_FIELD_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECT_FIELDS.company.parentCompany.universalIdentifier,
  STANDARD_OBJECT_FIELDS.company.childCompanies.universalIdentifier,
];

const SEED_WIDGET_TYPES: string[] = [
  WidgetType.CALLS,
  WidgetType.COMMUNICATIONS,
];

const NON_REFERENCE_KEYS = new Set([
  'id',
  'universalIdentifier',
  'applicationId',
  'applicationUniversalIdentifier',
  'workspaceId',
]);

// Only parent pointers count: child lists (tabUniversalIdentifiers, ...) would
// drag in a whole standard layout that merely lists a new tab. Widget
// configurations still point at fields by id, so ids count too.
export const collectParentReferences = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      typeof item === 'object' && item !== null
        ? collectParentReferences(item)
        : [],
    );
  }

  if (typeof value !== 'object' || value === null) {
    return [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    if (NON_REFERENCE_KEYS.has(key)) {
      return [];
    }

    if (typeof nestedValue === 'string') {
      return key.endsWith('UniversalIdentifier') || key.endsWith('Id')
        ? [nestedValue]
        : [];
    }

    return collectParentReferences(nestedValue);
  });
};

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

export const selectActivityObjectsStandardAdditions = ({
  existing,
  standard,
}: {
  existing: ActivityObjectsFlatEntityMaps;
  standard: ActivityObjectsFlatEntityMaps;
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

  // The walk covers existing entities too, so a half-provisioned workspace is completed
  const selected = new Set<string>();
  // Standard ids are only consistent within the standard maps, so they are tracked apart
  const selectedReferences = new Set<string>();

  const select = (entity: LooseFlatEntity) => {
    selected.add(entity.universalIdentifier);
    selectedReferences.add(entity.universalIdentifier);
    selectedReferences.add(entity.id);
  };

  for (const universalIdentifier of [
    ...ACTIVITY_OBJECT_UNIVERSAL_IDENTIFIERS,
    ...SEED_FIELD_UNIVERSAL_IDENTIFIERS,
  ]) {
    const seedEntity = (standard.flatObjectMetadataMaps.byUniversalIdentifier[
      universalIdentifier
    ] ??
      standard.flatFieldMetadataMaps.byUniversalIdentifier[
        universalIdentifier
      ]) as LooseFlatEntity | undefined;

    if (isDefined(seedEntity)) {
      select(seedEntity);
    }
  }

  for (const widget of standardByMapsKey.flatPageLayoutWidgetMaps) {
    if (SEED_WIDGET_TYPES.includes(widget.type as string)) {
      select(widget);
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

    // A new tab on an existing layout is reached through its widget
    for (const widget of standardByMapsKey.flatPageLayoutWidgetMaps) {
      const tabUniversalIdentifier =
        widget.pageLayoutTabUniversalIdentifier as string;

      const missingTab = missingByMapsKey.flatPageLayoutTabMaps.find(
        (tab) => tab.universalIdentifier === tabUniversalIdentifier,
      );

      // Not a reference: the tab's other widgets must not ride in on it
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
