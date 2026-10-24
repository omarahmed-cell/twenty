import {
  STANDARD_OBJECTS,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import {
  ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS,
  type ActivityObjectsFlatEntityMaps,
  selectActivityObjectsStandardAdditions,
} from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';

const { allFlatEntityMaps: standard } =
  computeTwentyStandardApplicationAllFlatEntityMaps({
    now: '2026-01-01T00:00:00.000Z',
    workspaceId: '20202020-0000-4000-8000-000000000000',
    twentyStandardApplicationId: '20202020-0000-4000-8000-000000000001',
  });

const withoutUniversalIdentifiers = (
  universalIdentifiers: Set<string>,
): ActivityObjectsFlatEntityMaps =>
  Object.fromEntries(
    ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
      mapsKey,
      {
        ...standard[mapsKey],
        byUniversalIdentifier: Object.fromEntries(
          Object.entries(standard[mapsKey].byUniversalIdentifier).filter(
            ([universalIdentifier]) =>
              !universalIdentifiers.has(universalIdentifier),
          ),
        ),
      },
    ]),
  ) as unknown as ActivityObjectsFlatEntityMaps;

const universalIdentifiersOf = (additions: Record<string, unknown[]>) =>
  new Set(
    Object.values(additions)
      .flat()
      .map(
        (flatEntity) =>
          (flatEntity as { universalIdentifier: string }).universalIdentifier,
      ),
  );

// Mirrors the rollback: everything the fork owns, including what it adds to existing layouts
const computeActivityObjectsUniversalIdentifiers = () => {
  const {
    additions,
    droppedTabUniversalIdentifiers,
    droppedWidgetUniversalIdentifiers,
  } = selectActivityObjectsStandardAdditions({
    existing: withoutUniversalIdentifiers(
      new Set(
        ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.flatMap((mapsKey) =>
          Object.keys(standard[mapsKey].byUniversalIdentifier),
        ),
      ),
    ),
    standard,
  });

  const activityOnlyTabUniversalIdentifiers =
    droppedTabUniversalIdentifiers.filter((tabUniversalIdentifier) =>
      Object.values(standard.flatPageLayoutWidgetMaps.byUniversalIdentifier)
        .filter(isDefined)
        .filter(
          (widget) =>
            widget.pageLayoutTabUniversalIdentifier === tabUniversalIdentifier,
        )
        .every((widget) =>
          droppedWidgetUniversalIdentifiers.includes(
            widget.universalIdentifier,
          ),
        ),
    );

  return new Set([
    ...universalIdentifiersOf(additions),
    ...droppedWidgetUniversalIdentifiers,
    ...activityOnlyTabUniversalIdentifiers,
  ]);
};

describe('selectActivityObjectsStandardAdditions', () => {
  it('selects nothing when the workspace already matches the standard definitions', () => {
    const { additions, droppedTabUniversalIdentifiers } =
      selectActivityObjectsStandardAdditions({
        existing: withoutUniversalIdentifiers(new Set()),
        standard,
      });

    expect(universalIdentifiersOf(additions).size).toBe(0);
    expect(droppedTabUniversalIdentifiers).toEqual([]);
  });

  it('restores exactly the fork entities a pre-fork workspace lacks', () => {
    const activityObjectsUniversalIdentifiers =
      computeActivityObjectsUniversalIdentifiers();

    const { additions, droppedTabUniversalIdentifiers } =
      selectActivityObjectsStandardAdditions({
        existing: withoutUniversalIdentifiers(
          activityObjectsUniversalIdentifiers,
        ),
        standard,
      });

    expect(droppedTabUniversalIdentifiers).toEqual([]);
    expect([...universalIdentifiersOf(additions)].sort()).toEqual(
      [...activityObjectsUniversalIdentifiers].sort(),
    );
  });

  it('covers the new objects, the Company hierarchy and the tabs on existing record pages', () => {
    const activityObjectsUniversalIdentifiers =
      computeActivityObjectsUniversalIdentifiers();

    const companyTabs =
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.companyRecordPage.tabs;

    for (const universalIdentifier of [
      STANDARD_OBJECTS.service.universalIdentifier,
      STANDARD_OBJECTS.callTarget.universalIdentifier,
      STANDARD_OBJECTS.communication.universalIdentifier,
      STANDARD_OBJECTS.company.fields.parentCompany.universalIdentifier,
      STANDARD_OBJECTS.person.fields.callTargets.universalIdentifier,
      STANDARD_OBJECTS.noteTarget.fields.targetService.universalIdentifier,
      companyTabs.calls.universalIdentifier,
      companyTabs.communications.universalIdentifier,
      companyTabs.home.widgets.services.universalIdentifier,
    ]) {
      expect(activityObjectsUniversalIdentifiers.has(universalIdentifier)).toBe(
        true,
      );
    }

    expect(
      activityObjectsUniversalIdentifiers.has(
        companyTabs.home.universalIdentifier,
      ),
    ).toBe(false);
    expect(
      activityObjectsUniversalIdentifiers.has(
        STANDARD_OBJECTS.person.universalIdentifier,
      ),
    ).toBe(false);
  });

  it('adds a missing section widget without recreating the tab it sits on', () => {
    const servicesWidgetUniversalIdentifier =
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.companyRecordPage.tabs.home
        .widgets.services.universalIdentifier;

    const { additions } = selectActivityObjectsStandardAdditions({
      existing: withoutUniversalIdentifiers(
        new Set([servicesWidgetUniversalIdentifier]),
      ),
      standard,
    });

    expect([...universalIdentifiersOf(additions)]).toEqual([
      servicesWidgetUniversalIdentifier,
    ]);
  });

  it('skips a new tab whose record page layout the workspace does not have', () => {
    const companyRecordPage =
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.companyRecordPage;

    const { additions, droppedTabUniversalIdentifiers } =
      selectActivityObjectsStandardAdditions({
        existing: withoutUniversalIdentifiers(
          new Set([
            companyRecordPage.universalIdentifier,
            companyRecordPage.tabs.calls.universalIdentifier,
            companyRecordPage.tabs.calls.widgets.calls.universalIdentifier,
          ]),
        ),
        standard,
      });

    expect(droppedTabUniversalIdentifiers).toEqual([
      companyRecordPage.tabs.calls.universalIdentifier,
    ]);
    expect(universalIdentifiersOf(additions).size).toBe(0);
  });
});
