import { STANDARD_OBJECTS } from 'twenty-shared/metadata';

import { buildActivityAssignedToLabelUpdates } from 'src/database/commands/upgrade-version-command/2-49/utils/build-activity-assigned-to-label-updates.util';

const TASK_ASSIGNEE_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECTS.task.fields.assignee.universalIdentifier;
const MEETING_ASSIGNED_TO_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECTS.calendarEvent.fields.assignedTo.universalIdentifier;

const toMaps = (fields: { universalIdentifier: string; label: string }[]) =>
  ({
    byUniversalIdentifier: Object.fromEntries(
      fields.map((field) => [field.universalIdentifier, field]),
    ),
    universalIdentifierById: {},
    universalIdentifiersByApplicationId: {},
  }) as never;

const STANDARD_FIELDS = [
  {
    universalIdentifier: TASK_ASSIGNEE_UNIVERSAL_IDENTIFIER,
    label: 'Activity assigned to',
  },
  {
    universalIdentifier: MEETING_ASSIGNED_TO_UNIVERSAL_IDENTIFIER,
    label: 'Activity assigned to',
  },
];

describe('buildActivityAssignedToLabelUpdates', () => {
  it('relabels the task and meeting fields still at their previous defaults', () => {
    const updates = buildActivityAssignedToLabelUpdates({
      existingFlatFieldMetadataMaps: toMaps([
        {
          universalIdentifier: TASK_ASSIGNEE_UNIVERSAL_IDENTIFIER,
          label: 'Assignee',
        },
        {
          universalIdentifier: MEETING_ASSIGNED_TO_UNIVERSAL_IDENTIFIER,
          label: 'Assigned to',
        },
      ]),
      standardFlatFieldMetadataMaps: toMaps(STANDARD_FIELDS),
      direction: 'up',
    });

    expect(updates).toEqual([
      expect.objectContaining({
        universalIdentifier: TASK_ASSIGNEE_UNIVERSAL_IDENTIFIER,
        label: 'Activity assigned to',
      }),
      expect.objectContaining({
        universalIdentifier: MEETING_ASSIGNED_TO_UNIVERSAL_IDENTIFIER,
        label: 'Activity assigned to',
      }),
    ]);
  });

  it('keeps a label the workspace renamed and skips one already moved', () => {
    expect(
      buildActivityAssignedToLabelUpdates({
        existingFlatFieldMetadataMaps: toMaps([
          {
            universalIdentifier: TASK_ASSIGNEE_UNIVERSAL_IDENTIFIER,
            label: 'Owner',
          },
          {
            universalIdentifier: MEETING_ASSIGNED_TO_UNIVERSAL_IDENTIFIER,
            label: 'Activity assigned to',
          },
        ]),
        standardFlatFieldMetadataMaps: toMaps(STANDARD_FIELDS),
        direction: 'up',
      }),
    ).toEqual([]);
  });

  it('restores the previous labels on rollback', () => {
    expect(
      buildActivityAssignedToLabelUpdates({
        existingFlatFieldMetadataMaps: toMaps(STANDARD_FIELDS),
        standardFlatFieldMetadataMaps: toMaps(STANDARD_FIELDS),
        direction: 'down',
      }).map(({ label }) => label),
    ).toEqual(['Assignee', 'Assigned to']);
  });
});
