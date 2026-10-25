import {
  STANDARD_OBJECTS,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-shared/metadata';

import {
  ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS,
  type ActivityObjectsFlatEntityMaps,
} from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { selectCatalogObjectsStandardAdditions } from 'src/database/commands/upgrade-version-command/2-49/utils/select-catalog-objects-standard-additions.util';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';

const { allFlatEntityMaps: standard } =
  computeTwentyStandardApplicationAllFlatEntityMaps({
    now: '2026-01-01T00:00:00.000Z',
    workspaceId: '20202020-0000-4000-8000-000000000000',
    twentyStandardApplicationId: '20202020-0000-4000-8000-000000000001',
  });

const standardMaps = standard as unknown as ActivityObjectsFlatEntityMaps;

const universalIdentifiersOf = (additions: Record<string, unknown[]>) =>
  new Set(
    Object.values(additions)
      .flat()
      .map(
        (flatEntity) =>
          (flatEntity as { universalIdentifier: string }).universalIdentifier,
      ),
  );

// A workspace provisioned before the catalog: the full standard minus everything that refers to it
const computeWorkspaceWithoutCatalog = (): ActivityObjectsFlatEntityMaps => {
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

  const {
    additions,
    droppedTabUniversalIdentifiers,
    droppedWidgetUniversalIdentifiers,
  } = selectCatalogObjectsStandardAdditions({
    existing: emptyMaps,
    standard: standardMaps,
  });

  const catalogUniversalIdentifiers = new Set([
    ...universalIdentifiersOf(additions),
    ...droppedWidgetUniversalIdentifiers,
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
      .lineItems.universalIdentifier,
  ]);

  expect(droppedTabUniversalIdentifiers).toContain(
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
      .lineItems.universalIdentifier,
  );

  return Object.fromEntries(
    ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
      mapsKey,
      {
        ...standardMaps[mapsKey],
        byUniversalIdentifier: Object.fromEntries(
          Object.entries(standardMaps[mapsKey].byUniversalIdentifier).filter(
            ([universalIdentifier]) =>
              !catalogUniversalIdentifiers.has(universalIdentifier),
          ),
        ),
      },
    ]),
  ) as unknown as ActivityObjectsFlatEntityMaps;
};

describe('selectCatalogObjectsStandardAdditions', () => {
  it('should add the catalog objects, the deal relation and the Line of Item tab', () => {
    const { additions, droppedTabUniversalIdentifiers } =
      selectCatalogObjectsStandardAdditions({
        existing: computeWorkspaceWithoutCatalog(),
        standard: standardMaps,
      });

    const addedUniversalIdentifiers = universalIdentifiersOf(additions);

    expect(droppedTabUniversalIdentifiers).toEqual([]);
    expect(
      additions.flatObjectMetadataMaps.map(
        ({ universalIdentifier }) => universalIdentifier,
      ),
    ).toEqual(
      expect.arrayContaining([
        STANDARD_OBJECTS.product.universalIdentifier,
        STANDARD_OBJECTS.lineItem.universalIdentifier,
      ]),
    );
    expect(additions.flatObjectMetadataMaps).toHaveLength(2);

    for (const universalIdentifier of [
      STANDARD_OBJECTS.opportunity.fields.lineItems.universalIdentifier,
      STANDARD_OBJECTS.lineItem.fields.totalPrice.universalIdentifier,
      STANDARD_OBJECTS.lineItem.views.dealRecordPageLineItems
        .universalIdentifier,
      STANDARD_OBJECTS.lineItem.views.dealRecordPageLineItems.viewFilters
        .dealIsCurrentRecord.universalIdentifier,
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
        .lineItems.universalIdentifier,
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
        .lineItems.widgets.lineItems.universalIdentifier,
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.productRecordPage
        .universalIdentifier,
    ]) {
      expect(addedUniversalIdentifiers).toContain(universalIdentifier);
    }

    expect(additions.flatNavigationMenuItemMaps).toHaveLength(2);
  });

  it('should leave the existing deal page layout and its other tabs alone', () => {
    const { additions } = selectCatalogObjectsStandardAdditions({
      existing: computeWorkspaceWithoutCatalog(),
      standard: standardMaps,
    });

    const addedUniversalIdentifiers = universalIdentifiersOf(additions);

    expect(addedUniversalIdentifiers).not.toContain(
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage
        .universalIdentifier,
    );
    expect(addedUniversalIdentifiers).not.toContain(
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
        .timeline.universalIdentifier,
    );
    expect(addedUniversalIdentifiers).not.toContain(
      STANDARD_OBJECTS.opportunity.universalIdentifier,
    );
  });

  it('should add nothing to a workspace that already has the catalog', () => {
    const { additions } = selectCatalogObjectsStandardAdditions({
      existing: standardMaps,
      standard: standardMaps,
    });

    expect(universalIdentifiersOf(additions).size).toBe(0);
  });
});
