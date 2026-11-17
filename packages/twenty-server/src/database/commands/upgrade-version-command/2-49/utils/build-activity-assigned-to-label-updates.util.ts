import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';

const PREVIOUS_LABEL_BY_UNIVERSAL_IDENTIFIER: Record<string, string> = {
  [STANDARD_OBJECTS.task.fields.assignee.universalIdentifier]: 'Assignee',
  [STANDARD_OBJECTS.calendarEvent.fields.assignedTo.universalIdentifier]:
    'Assigned to',
};

// Only a label still at its previous default moves, so a workspace rename survives
export const buildActivityAssignedToLabelUpdates = ({
  existingFlatFieldMetadataMaps,
  standardFlatFieldMetadataMaps,
  direction,
}: {
  existingFlatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  standardFlatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  direction: 'up' | 'down';
}): FlatFieldMetadata[] =>
  Object.entries(PREVIOUS_LABEL_BY_UNIVERSAL_IDENTIFIER).flatMap(
    ([universalIdentifier, previousLabel]) => {
      const existingField =
        existingFlatFieldMetadataMaps.byUniversalIdentifier[
          universalIdentifier
        ];
      const standardField =
        standardFlatFieldMetadataMaps.byUniversalIdentifier[
          universalIdentifier
        ];

      if (!isDefined(existingField) || !isDefined(standardField)) {
        return [];
      }

      const [fromLabel, toLabel] =
        direction === 'up'
          ? [previousLabel, standardField.label]
          : [standardField.label, previousLabel];

      return existingField.label === fromLabel && fromLabel !== toLabel
        ? [{ ...existingField, label: toLabel }]
        : [];
    },
  );
