import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { RelationType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { STANDARD_TIMELINE_ACTIVITY_TYPE_DEFINITIONS } from 'src/engine/metadata-modules/timeline-activity-type/constants/standard-timeline-activity-type-definitions.constant';

const { allFlatEntityMaps } = computeTwentyStandardApplicationAllFlatEntityMaps(
  {
    now: '2026-11-15T00:00:00.000Z',
    workspaceId: '20202020-1111-4111-8111-111111111111',
    twentyStandardApplicationId: '20202020-2222-4222-8222-222222222222',
  },
);

const getField = (universalIdentifier: string) =>
  allFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier[
    universalIdentifier
  ];

const COLLABORATOR_FIELDS = STANDARD_OBJECTS.opportunityCollaborator.fields;

describe('Deal collaborators junction', () => {
  it('links a deal to many workspace members through opportunityCollaborator', () => {
    const dealCollaborators = getField(
      STANDARD_OBJECTS.opportunity.fields.dealCollaborators.universalIdentifier,
    );
    const workspaceMemberField = getField(
      COLLABORATOR_FIELDS.workspaceMember.universalIdentifier,
    );

    expect(dealCollaborators?.universalSettings).toMatchObject({
      relationType: RelationType.ONE_TO_MANY,
      junctionTargetFieldUniversalIdentifier:
        COLLABORATOR_FIELDS.workspaceMember.universalIdentifier,
    });
    expect(workspaceMemberField?.settings).toMatchObject({
      relationType: RelationType.MANY_TO_ONE,
      joinColumnName: 'workspaceMemberId',
    });
    expect(
      getField(
        STANDARD_OBJECTS.workspaceMember.fields.collaboratingOpportunities
          .universalIdentifier,
      )?.label,
    ).toBe('Collaborating deals');
  });

  it('refuses the same collaborator twice on a deal while allowing re-adding after removal', () => {
    const uniqueIndex =
      allFlatEntityMaps.flatIndexMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.opportunityCollaborator.indexes
          .workspaceMemberOpportunityUniqueIndex.universalIdentifier
      ];

    expect(uniqueIndex).toMatchObject({
      isUnique: true,
      indexWhereClause: '"deletedAt" IS NULL',
    });
    expect(
      uniqueIndex?.universalFlatIndexFieldMetadatas.map(
        ({ fieldMetadataUniversalIdentifier }) =>
          fieldMetadataUniversalIdentifier,
      ),
    ).toEqual([
      COLLABORATOR_FIELDS.workspaceMember.universalIdentifier,
      COLLABORATOR_FIELDS.opportunity.universalIdentifier,
    ]);
  });

  it('writes a deal timeline entry when a collaborator is added or removed', () => {
    const collaboratorTimelineActions =
      STANDARD_TIMELINE_ACTIVITY_TYPE_DEFINITIONS.filter(
        (definition) =>
          definition.targetRelationFieldUniversalIdentifier ===
          STANDARD_OBJECTS.workspaceMember.fields.collaboratingOpportunities
            .universalIdentifier,
      ).map(({ action }) => action);

    expect(collaboratorTimelineActions.sort()).toEqual(['linked', 'unlinked']);
    expect(
      isDefined(
        allFlatEntityMaps.flatTimelineActivityTypeMaps.byUniversalIdentifier[
          '76c1f5a1-c9f5-4a42-8609-7715963069eb'
        ],
      ),
    ).toBe(true);
  });
});
