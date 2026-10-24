import { isDefined } from 'twenty-shared/utils';

import {
  type ActivityObjectsFlatEntities,
  type ActivityObjectsFlatEntityMaps,
} from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';

export const RENAMED_STANDARD_LABELS: Record<string, string> = {
  Person: 'Contact',
  People: 'Contacts',
  Opportunity: 'Deal',
  Opportunities: 'Deals',
  Calendar: 'Meetings',
};

const LABEL_PROPERTIES_BY_MAPS_KEY = {
  flatObjectMetadataMaps: ['labelSingular', 'labelPlural'],
  flatFieldMetadataMaps: ['label'],
  flatPageLayoutTabMaps: ['title'],
  flatPageLayoutWidgetMaps: ['title'],
} as const;

type LabelMapsKey = keyof typeof LABEL_PROPERTIES_BY_MAPS_KEY;

export type ActivityObjectsLabelUpdates = Pick<
  ActivityObjectsFlatEntities,
  LabelMapsKey
>;

// Only a label still at its old default moves, so a workspace rename survives;
// direction picks upgrade (old -> new) or rollback (new -> old)
export const buildActivityObjectsLabelUpdates = ({
  existing,
  standard,
  twentyStandardApplicationUniversalIdentifier,
  direction,
}: {
  existing: Pick<ActivityObjectsFlatEntityMaps, LabelMapsKey>;
  standard: Pick<ActivityObjectsFlatEntityMaps, LabelMapsKey>;
  twentyStandardApplicationUniversalIdentifier: string;
  direction: 'up' | 'down';
}): ActivityObjectsLabelUpdates => {
  const labelPairs = Object.entries(RENAMED_STANDARD_LABELS).map(
    ([oldLabel, newLabel]) =>
      direction === 'up'
        ? { from: oldLabel, to: newLabel }
        : { from: newLabel, to: oldLabel },
  );

  const buildUpdates = <TMapsKey extends LabelMapsKey>(mapsKey: TMapsKey) =>
    Object.values(existing[mapsKey].byUniversalIdentifier)
      .filter(isDefined)
      .flatMap((existingEntity) => {
        const standardEntity =
          standard[mapsKey].byUniversalIdentifier[
            existingEntity.universalIdentifier
          ];

        if (
          !isDefined(standardEntity) ||
          existingEntity.applicationUniversalIdentifier !==
            twentyStandardApplicationUniversalIdentifier
        ) {
          return [];
        }

        const changedProperties = Object.fromEntries(
          LABEL_PROPERTIES_BY_MAPS_KEY[mapsKey].flatMap((property) => {
            const currentValue = (existingEntity as Record<string, unknown>)[
              property
            ];
            const standardValue = (standardEntity as Record<string, unknown>)[
              property
            ];
            const pair = labelPairs.find(({ from }) => from === currentValue);

            const isRenamedByStandard =
              direction === 'up'
                ? standardValue === pair?.to
                : standardValue === pair?.from;

            return isDefined(pair) && isRenamedByStandard
              ? [[property, pair.to]]
              : [];
          }),
        );

        return Object.keys(changedProperties).length > 0
          ? [{ ...existingEntity, ...changedProperties }]
          : [];
      });

  return {
    flatObjectMetadataMaps: buildUpdates('flatObjectMetadataMaps'),
    flatFieldMetadataMaps: buildUpdates('flatFieldMetadataMaps'),
    flatPageLayoutTabMaps: buildUpdates('flatPageLayoutTabMaps'),
    flatPageLayoutWidgetMaps: buildUpdates('flatPageLayoutWidgetMaps'),
  } as ActivityObjectsLabelUpdates;
};
