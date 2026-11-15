import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { FieldMetadataType, MetadataWritability } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';

const WORKSPACE_ID = '20202020-1111-4111-8111-111111111111';
const TWENTY_STANDARD_APPLICATION_ID = '20202020-2222-4222-8222-222222222222';
const NOW = '2024-01-01T00:00:00.000Z';

describe('Standard field writability', () => {
  const { allFlatEntityMaps } =
    computeTwentyStandardApplicationAllFlatEntityMaps({
      now: NOW,
      workspaceId: WORKSPACE_ID,
      twentyStandardApplicationId: TWENTY_STANDARD_APPLICATION_ID,
    });

  const standardFlatFieldMetadatas = Object.values(
    allFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier,
  ).filter(isDefined);

  const companyServerComputedFieldUniversalIdentifiers = new Set(
    Object.entries(STANDARD_OBJECTS.company.fields)
      .filter(([fieldName]) =>
        /^(isParentCompany|isChildCompany|numberOf[A-Za-z]+|lastActivityDate|dateEntered[A-Za-z]+|dateExited[A-Za-z]+)$/.test(
          fieldName,
        ),
      )
      .map(([, { universalIdentifier }]) => universalIdentifier),
  );

  const personServerComputedFieldUniversalIdentifiers = new Set(
    Object.entries(STANDARD_OBJECTS.person.fields)
      .filter(([fieldName]) =>
        /^(ownerAssignedDate|sdrOwnerAssignedDate|lastActivityDate|firstDealCreatedDate|timeInCurrentStage|dateEntered[A-Za-z]+|dateExited[A-Za-z]+)$/.test(
          fieldName,
        ),
      )
      .map(([, { universalIdentifier }]) => universalIdentifier),
  );

  const companyAssignedDateFieldUniversalIdentifiers = new Set([
    STANDARD_OBJECTS.company.fields.ownerAssignedDate.universalIdentifier,
    STANDARD_OBJECTS.company.fields.sdrOwnerAssignedDate.universalIdentifier,
  ]);

  const serverWrittenFieldUniversalIdentifiers = new Set([
    ...companyServerComputedFieldUniversalIdentifiers,
    ...personServerComputedFieldUniversalIdentifiers,
    ...companyAssignedDateFieldUniversalIdentifiers,
  ]);

  const searchVectorFlatFieldMetadatas = standardFlatFieldMetadatas.filter(
    (flatFieldMetadata) =>
      flatFieldMetadata.type === FieldMetadataType.TS_VECTOR,
  );

  it('marks every search vector field as SYSTEM, since Postgres generates the column', () => {
    expect(searchVectorFlatFieldMetadatas.length).toBeGreaterThan(0);
    expect(
      searchVectorFlatFieldMetadatas.every(
        (flatFieldMetadata) =>
          flatFieldMetadata.writability === MetadataWritability.SYSTEM,
      ),
    ).toBe(true);
  });

  it('marks the server-computed company fields as SYSTEM, so only the server writes them', () => {
    const companyServerComputedFlatFieldMetadatas =
      standardFlatFieldMetadatas.filter((flatFieldMetadata) =>
        companyServerComputedFieldUniversalIdentifiers.has(
          flatFieldMetadata.universalIdentifier,
        ),
      );

    expect(companyServerComputedFlatFieldMetadatas).toHaveLength(30);
    expect(
      companyServerComputedFlatFieldMetadatas.every(
        (flatFieldMetadata) =>
          flatFieldMetadata.writability === MetadataWritability.SYSTEM,
      ),
    ).toBe(true);
  });

  it('marks the server-written person fields and the assigned dates as SYSTEM', () => {
    const serverWrittenFlatFieldMetadatas = standardFlatFieldMetadatas.filter(
      (flatFieldMetadata) =>
        personServerComputedFieldUniversalIdentifiers.has(
          flatFieldMetadata.universalIdentifier,
        ) ||
        companyAssignedDateFieldUniversalIdentifiers.has(
          flatFieldMetadata.universalIdentifier,
        ),
    );

    expect(serverWrittenFlatFieldMetadatas).toHaveLength(30);
    expect(
      serverWrittenFlatFieldMetadatas.every(
        (flatFieldMetadata) =>
          flatFieldMetadata.writability === MetadataWritability.SYSTEM,
      ),
    ).toBe(true);
  });

  it('leaves fields outside protected history and search vectors OPEN', () => {
    const nonSearchVectorWritabilities = new Set(
      standardFlatFieldMetadatas
        .filter(
          (flatFieldMetadata) =>
            flatFieldMetadata.type !== FieldMetadataType.TS_VECTOR &&
            !serverWrittenFieldUniversalIdentifiers.has(
              flatFieldMetadata.universalIdentifier,
            ) &&
            ![
              STANDARD_OBJECTS.agentChatThread.universalIdentifier,
              STANDARD_OBJECTS.agentMessage.universalIdentifier,
              STANDARD_OBJECTS.agentMessagePart.universalIdentifier,
              STANDARD_OBJECTS.agentMessageReaction.universalIdentifier,
              STANDARD_OBJECTS.agentTurn.universalIdentifier,
              STANDARD_OBJECTS.agentChatThreadParticipant.universalIdentifier,
              STANDARD_OBJECTS.campaignDelivery.universalIdentifier,
              STANDARD_OBJECTS.messageSuppression.universalIdentifier,
            ].some(
              (identifier) =>
                identifier ===
                flatFieldMetadata.objectMetadataUniversalIdentifier,
            ),
        )
        .map((flatFieldMetadata) => flatFieldMetadata.writability),
    );

    expect([...nonSearchVectorWritabilities]).toEqual([
      MetadataWritability.OPEN,
    ]);
  });
});
