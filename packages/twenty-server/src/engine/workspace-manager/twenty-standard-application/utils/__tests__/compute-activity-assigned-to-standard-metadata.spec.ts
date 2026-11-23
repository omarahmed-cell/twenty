import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { RelationOnDeleteAction, RelationType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';

const WORKSPACE_ID = '20202020-1111-4111-8111-111111111111';
const TWENTY_STANDARD_APPLICATION_ID = '20202020-2222-4222-8222-222222222222';
const NOW = '2024-01-01T00:00:00.000Z';

const ACTIVITY_OBJECTS = [
  {
    objectName: 'call',
    inverseFieldName: 'assignedCalls',
    indexViewName: 'allCalls',
    recordPageViewName: 'callRecordPageFields',
  },
  {
    objectName: 'note',
    inverseFieldName: 'assignedNotes',
    indexViewName: 'allNotes',
    recordPageViewName: 'noteRecordPageFields',
  },
  {
    objectName: 'email',
    inverseFieldName: 'assignedEmails',
    indexViewName: 'allEmails',
    recordPageViewName: 'emailRecordPageFields',
  },
  {
    objectName: 'communication',
    inverseFieldName: 'assignedCommunications',
    indexViewName: 'allCommunications',
    recordPageViewName: 'communicationRecordPageFields',
  },
] as const;

describe('Activity assigned to standard metadata build', () => {
  const { allFlatEntityMaps } =
    computeTwentyStandardApplicationAllFlatEntityMaps({
      now: NOW,
      workspaceId: WORKSPACE_ID,
      twentyStandardApplicationId: TWENTY_STANDARD_APPLICATION_ID,
    });

  const workspaceMemberFields = STANDARD_OBJECTS.workspaceMember
    .fields as Record<string, { universalIdentifier: string }>;

  it.each(ACTIVITY_OBJECTS)(
    'links $objectName.assignedTo to a workspace member',
    ({ objectName, inverseFieldName }) => {
      const { byUniversalIdentifier } = allFlatEntityMaps.flatFieldMetadataMaps;
      const assignedToField =
        byUniversalIdentifier[
          STANDARD_OBJECTS[objectName].fields.assignedTo.universalIdentifier
        ];
      const inverseField =
        byUniversalIdentifier[
          workspaceMemberFields[inverseFieldName].universalIdentifier
        ];

      expect(assignedToField).toMatchObject({
        name: 'assignedTo',
        label: 'Activity assigned to',
        isNullable: true,
        relationTargetFieldMetadataId: inverseField?.id,
        settings: {
          relationType: RelationType.MANY_TO_ONE,
          onDelete: RelationOnDeleteAction.SET_NULL,
          joinColumnName: 'assignedToId',
        },
      });
      expect(inverseField).toMatchObject({
        name: inverseFieldName,
        relationTargetFieldMetadataId: assignedToField?.id,
        settings: { relationType: RelationType.ONE_TO_MANY },
      });
    },
  );

  it.each(ACTIVITY_OBJECTS)(
    'indexes $objectName.assignedTo and shows it on the index and record page views',
    ({ objectName, indexViewName, recordPageViewName }) => {
      const standardObject = STANDARD_OBJECTS[objectName];
      const views = standardObject.views as Record<
        string,
        { viewFields: Record<string, { universalIdentifier: string }> }
      >;

      expect(
        allFlatEntityMaps.flatIndexMaps.byUniversalIdentifier[
          standardObject.indexes.assignedToIdIndex.universalIdentifier
        ],
      ).toBeDefined();

      for (const viewName of [indexViewName, recordPageViewName]) {
        const viewField =
          allFlatEntityMaps.flatViewFieldMaps.byUniversalIdentifier[
            views[viewName].viewFields.assignedTo.universalIdentifier
          ];

        expect(viewField).toMatchObject({
          fieldMetadataUniversalIdentifier:
            standardObject.fields.assignedTo.universalIdentifier,
          isVisible: true,
        });
      }
    },
  );

  it('relabels the task and meeting assignee fields', () => {
    const labels = [
      STANDARD_OBJECTS.task.fields.assignee.universalIdentifier,
      STANDARD_OBJECTS.meeting.fields.assignedTo.universalIdentifier,
    ]
      .map(
        (universalIdentifier) =>
          allFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier[
            universalIdentifier
          ],
      )
      .filter(isDefined)
      .map(({ label }) => label);

    expect(labels).toEqual(['Activity assigned to', 'Assigned to']);
  });
});
