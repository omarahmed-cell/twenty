import { FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { CommonQueryRunnerExceptionCode } from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { ActorFromAuthContextService } from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';

const WORKSPACE_ID = '20202020-1111-4111-8111-111111111111';

const { allFlatEntityMaps } = computeTwentyStandardApplicationAllFlatEntityMaps(
  {
    now: '2024-01-01T00:00:00.000Z',
    workspaceId: WORKSPACE_ID,
    twentyStandardApplicationId: '20202020-2222-4222-8222-222222222222',
  },
);

const flatFieldMetadatas = Object.values(
  allFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier,
).filter(isDefined);

// The cache links each object to its fields, which the standard builders leave empty
const flatObjectMetadataMaps = {
  ...allFlatEntityMaps.flatObjectMetadataMaps,
  byUniversalIdentifier: Object.fromEntries(
    Object.entries(
      allFlatEntityMaps.flatObjectMetadataMaps.byUniversalIdentifier,
    ).map(([universalIdentifier, flatObjectMetadata]) => [
      universalIdentifier,
      isDefined(flatObjectMetadata)
        ? {
            ...flatObjectMetadata,
            fieldIds: flatFieldMetadatas
              .filter(
                ({ objectMetadataId }) =>
                  objectMetadataId === flatObjectMetadata.id,
              )
              .map(({ id }) => id),
          }
        : flatObjectMetadata,
    ]),
  ),
};

const workspace = { id: WORKSPACE_ID } as WorkspaceAuthContext['workspace'];

const USER_AUTH_CONTEXT = {
  type: 'user',
  workspace,
  workspaceMemberId: '20202020-0687-4c41-b707-ed1bfca972a7',
  workspaceMember: { name: { firstName: 'Tim', lastName: 'Apple' } },
} as unknown as WorkspaceAuthContext;

const API_KEY_AUTH_CONTEXT = {
  type: 'apiKey',
  workspace,
  apiKey: { name: 'Zapier' },
} as unknown as WorkspaceAuthContext;

const buildService = () =>
  new ActorFromAuthContextService({
    getOrRecomputeManyOrAllFlatEntityMaps: jest.fn().mockResolvedValue({
      flatObjectMetadataMaps,
      flatFieldMetadataMaps: allFlatEntityMaps.flatFieldMetadataMaps,
    }),
  } as unknown as WorkspaceManyOrAllFlatEntityMapsCacheService);

describe('ActorFromAuthContextService record source', () => {
  it('sets the record source to MANUAL for a record a user creates', async () => {
    const [record] = await buildService().injectActorFieldsOnCreate({
      records: [{ name: 'Acme' }],
      objectMetadataNameSingular: 'company',
      authContext: USER_AUTH_CONTEXT,
    });

    expect(record.recordSource).toBe(FieldActorSource.MANUAL);
  });

  it('sets the record source to API for a record an API key creates', async () => {
    const [record] = await buildService().injectActorFieldsOnCreate({
      records: [{ name: 'Acme' }],
      objectMetadataNameSingular: 'company',
      authContext: API_KEY_AUTH_CONTEXT,
    });

    expect(record.recordSource).toBe(FieldActorSource.API);
  });

  it.each([
    FieldActorSource.IMPORT,
    FieldActorSource.WORKFLOW,
    FieldActorSource.FORMS,
    FieldActorSource.DOCUMENT_APP,
  ])(
    'takes the record source %s from the createdBy source the caller set',
    async (source) => {
      const records = await buildService().injectActorFieldsOnCreate({
        records: [
          { name: 'Onboarding', createdBy: { source } },
          { name: 'Renewal', createdBy: { source } },
        ],
        objectMetadataNameSingular: 'service',
        authContext: USER_AUTH_CONTEXT,
      });

      expect(records.map(({ recordSource }) => recordSource)).toEqual([
        source,
        source,
      ]);
    },
  );

  it('leaves objects without a record source field alone', async () => {
    const [record] = await buildService().injectActorFieldsOnCreate({
      records: [{ name: 'Q3' }],
      objectMetadataNameSingular: 'dashboard',
      authContext: USER_AUTH_CONTEXT,
    });

    expect(record).not.toHaveProperty('recordSource');
  });

  it.each([
    ['a user', USER_AUTH_CONTEXT],
    ['an API key', API_KEY_AUTH_CONTEXT],
  ])(
    'refuses a record source in the create input of %s',
    async (_, authContext) => {
      await expect(
        buildService().injectActorFieldsOnCreate({
          records: [{ name: 'Acme', recordSource: FieldActorSource.IMPORT }],
          objectMetadataNameSingular: 'company',
          authContext,
        }),
      ).rejects.toMatchObject({
        code: CommonQueryRunnerExceptionCode.BAD_REQUEST,
      });
    },
  );

  it.each([
    ['a user', USER_AUTH_CONTEXT],
    ['an API key', API_KEY_AUTH_CONTEXT],
  ])(
    'refuses a record source in the update input of %s',
    async (_, authContext) => {
      for (const recordSource of [FieldActorSource.MANUAL, null]) {
        await expect(
          buildService().injectUpdatedBy({
            records: [{ recordSource }],
            objectMetadataNameSingular: 'person',
            authContext,
          }),
        ).rejects.toMatchObject({
          code: CommonQueryRunnerExceptionCode.BAD_REQUEST,
        });
      }
    },
  );
});
