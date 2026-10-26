import { STANDARD_OBJECTS } from 'twenty-shared/metadata';

import {
  type ActivityObjectsFlatEntities,
  type ActivityObjectsFlatEntityMaps,
} from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { selectStandardAdditionsFromSeeds } from 'src/database/commands/upgrade-version-command/2-49/utils/select-standard-additions-from-seeds.util';

export const CATALOG_OBJECT_UNIVERSAL_IDENTIFIERS: string[] = [
  STANDARD_OBJECTS.product.universalIdentifier,
  STANDARD_OBJECTS.lineItem.universalIdentifier,
];

// Product and Line Item with their fields, views and layouts, the deal's lineItems field
// and the deal page "Line of Item" tab
export const selectCatalogObjectsStandardAdditions = ({
  existing,
  standard,
}: {
  existing: ActivityObjectsFlatEntityMaps;
  standard: ActivityObjectsFlatEntityMaps;
}): {
  additions: ActivityObjectsFlatEntities;
  droppedTabUniversalIdentifiers: string[];
  droppedWidgetUniversalIdentifiers: string[];
} =>
  selectStandardAdditionsFromSeeds({
    existing,
    standard,
    seedUniversalIdentifiers: CATALOG_OBJECT_UNIVERSAL_IDENTIFIERS,
  });
