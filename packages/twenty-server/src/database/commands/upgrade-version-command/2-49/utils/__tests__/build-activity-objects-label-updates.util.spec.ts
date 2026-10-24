import { buildActivityObjectsLabelUpdates } from 'src/database/commands/upgrade-version-command/2-49/utils/build-activity-objects-label-updates.util';

const STANDARD_APPLICATION = 'standard-application';

const toMaps = <TEntity extends { universalIdentifier: string }>(
  entities: TEntity[],
) => ({
  byUniversalIdentifier: Object.fromEntries(
    entities.map((entity) => [entity.universalIdentifier, entity]),
  ),
  universalIdentifierById: {},
  universalIdentifiersByApplicationId: {},
});

const field = (
  universalIdentifier: string,
  label: string,
  applicationUniversalIdentifier = STANDARD_APPLICATION,
) => ({
  id: universalIdentifier,
  universalIdentifier,
  label,
  applicationUniversalIdentifier,
});

const buildUpdates = ({
  existingFields,
  standardFields,
  direction = 'up',
}: {
  existingFields: ReturnType<typeof field>[];
  standardFields: ReturnType<typeof field>[];
  direction?: 'up' | 'down';
}) =>
  buildActivityObjectsLabelUpdates({
    existing: {
      flatObjectMetadataMaps: toMaps([]),
      flatFieldMetadataMaps: toMaps(existingFields),
      flatPageLayoutTabMaps: toMaps([]),
      flatPageLayoutWidgetMaps: toMaps([]),
    } as never,
    standard: {
      flatObjectMetadataMaps: toMaps([]),
      flatFieldMetadataMaps: toMaps(standardFields),
      flatPageLayoutTabMaps: toMaps([]),
      flatPageLayoutWidgetMaps: toMaps([]),
    } as never,
    twentyStandardApplicationUniversalIdentifier: STANDARD_APPLICATION,
    direction,
  }).flatFieldMetadataMaps;

describe('buildActivityObjectsLabelUpdates', () => {
  it('renames a label still at its old default', () => {
    expect(
      buildUpdates({
        existingFields: [field('company-people', 'People')],
        standardFields: [field('company-people', 'Contacts')],
      }),
    ).toEqual([expect.objectContaining({ label: 'Contacts' })]);
  });

  it('keeps a label the workspace renamed itself', () => {
    expect(
      buildUpdates({
        existingFields: [field('company-people', 'Clients')],
        standardFields: [field('company-people', 'Contacts')],
      }),
    ).toEqual([]);
  });

  it('keeps a label the standard definitions did not rename', () => {
    expect(
      buildUpdates({
        existingFields: [field('participant-person', 'Person')],
        standardFields: [field('participant-person', 'Person')],
      }),
    ).toEqual([]);
  });

  it('ignores entities owned by another application', () => {
    expect(
      buildUpdates({
        existingFields: [field('company-people', 'People', 'custom')],
        standardFields: [field('company-people', 'Contacts')],
      }),
    ).toEqual([]);
  });

  it('restores the old label on rollback', () => {
    expect(
      buildUpdates({
        existingFields: [field('company-people', 'Contacts')],
        standardFields: [field('company-people', 'Contacts')],
        direction: 'down',
      }),
    ).toEqual([expect.objectContaining({ label: 'People' })]);
  });
});
