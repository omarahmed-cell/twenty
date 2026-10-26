import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import { type FindOperator } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { type WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { ActivityTargetCompanyCascadeService } from 'src/modules/activity-target/query-hooks/activity-target-company-cascade.service';

jest.mock(
  'src/engine/twenty-orm/storage/orm-workspace-context.storage',
  () => ({
    getWorkspaceContext: jest.fn(),
  }),
);

type FakeRecord = Record<string, string | null>;

type FakeField = {
  name: string;
  type: FieldMetadataType;
  relationTargetObjectName?: string;
  relationType?: RelationType;
};

const OBJECT_FIELDS: Record<string, FakeField[]> = {
  company: [
    { name: 'name', type: FieldMetadataType.TEXT },
    {
      name: 'parentCompany',
      type: FieldMetadataType.RELATION,
      relationTargetObjectName: 'company',
      relationType: RelationType.MANY_TO_ONE,
    },
  ],
  person: [
    {
      name: 'company',
      type: FieldMetadataType.RELATION,
      relationTargetObjectName: 'company',
      relationType: RelationType.MANY_TO_ONE,
    },
  ],
  opportunity: [
    {
      name: 'pointOfContact',
      type: FieldMetadataType.RELATION,
      relationTargetObjectName: 'person',
      relationType: RelationType.MANY_TO_ONE,
    },
    {
      name: 'company',
      type: FieldMetadataType.RELATION,
      relationTargetObjectName: 'company',
      relationType: RelationType.MANY_TO_ONE,
    },
  ],
  service: [
    {
      name: 'company',
      type: FieldMetadataType.RELATION,
      relationTargetObjectName: 'company',
      relationType: RelationType.MANY_TO_ONE,
    },
  ],
  pet: [
    {
      name: 'owner',
      type: FieldMetadataType.RELATION,
      relationTargetObjectName: 'company',
      relationType: RelationType.MANY_TO_ONE,
    },
  ],
  rocket: [{ name: 'name', type: FieldMetadataType.TEXT }],
  callTarget: [
    {
      name: 'call',
      type: FieldMetadataType.RELATION,
      relationTargetObjectName: 'call',
      relationType: RelationType.MANY_TO_ONE,
    },
    ...['person', 'company', 'opportunity', 'service', 'pet', 'rocket'].map(
      (objectName) => ({
        name: `target${objectName[0].toUpperCase()}${objectName.slice(1)}`,
        type: FieldMetadataType.MORPH_RELATION,
        relationTargetObjectName: objectName,
        relationType: RelationType.MANY_TO_ONE,
      }),
    ),
  ],
};

const buildFlatEntityMaps = (entities: { id: string }[]) => ({
  byUniversalIdentifier: Object.fromEntries(
    entities.map((entity) => [entity.id, entity]),
  ),
  universalIdentifierById: Object.fromEntries(
    entities.map((entity) => [entity.id, entity.id]),
  ),
  universalIdentifiersByApplicationId: {},
});

const buildWorkspaceContext = () => {
  const objectIdByNameSingular = Object.fromEntries(
    Object.keys(OBJECT_FIELDS).map((objectName) => [
      objectName,
      `object-${objectName}`,
    ]),
  );

  const flatFields = Object.entries(OBJECT_FIELDS).flatMap(
    ([objectName, fields]) =>
      fields.map((field) => ({
        id: `field-${objectName}-${field.name}`,
        universalIdentifier: `field-${objectName}-${field.name}`,
        morphId: null,
        name: field.name,
        type: field.type,
        isActive: true,
        objectMetadataId: objectIdByNameSingular[objectName],
        relationTargetObjectMetadataId: field.relationTargetObjectName
          ? `object-${field.relationTargetObjectName}`
          : null,
        settings: field.relationType
          ? { relationType: field.relationType }
          : {},
      })),
  );

  const flatObjects = Object.entries(OBJECT_FIELDS).map(
    ([objectName, fields]) => ({
      id: objectIdByNameSingular[objectName],
      nameSingular: objectName,
      fieldIds: fields.map((field) => `field-${objectName}-${field.name}`),
    }),
  );

  return {
    objectIdByNameSingular,
    flatObjectMetadataMaps: buildFlatEntityMaps(flatObjects),
    flatFieldMetadataMaps: buildFlatEntityMaps(flatFields),
  };
};

const matchesCondition = (
  value: string | null,
  condition: FindOperator<unknown>,
): boolean => {
  if (condition.type === 'in') {
    return (condition.value as unknown as string[]).includes(value as string);
  }

  if (condition.type === 'not') {
    return value !== null;
  }

  throw new Error(`Unsupported operator ${condition.type}`);
};

const createFakeRepository = (records: FakeRecord[]) => ({
  find: jest.fn(
    async ({
      where,
      withDeleted,
    }: {
      where: Record<string, FindOperator<unknown>>;
      withDeleted?: boolean;
    }) =>
      records.filter(
        (record) =>
          (withDeleted === true || !record.deletedAt) &&
          Object.entries(where).every(([fieldName, condition]) =>
            matchesCondition(record[fieldName] ?? null, condition),
          ),
      ),
  ),
  insert: jest.fn(async (newRecords: FakeRecord[]) => {
    records.push(...newRecords);
  }),
});

const authContext = {
  workspace: { id: 'workspace-id' },
} as unknown as WorkspaceAuthContext;

const callTarget = (
  id: string,
  callId: string,
  leg: Record<string, string>,
): FakeRecord => ({ id, callId, ...leg });

describe('ActivityTargetCompanyCascadeService', () => {
  beforeEach(() => {
    jest
      .mocked(getWorkspaceContext)
      .mockReturnValue(
        buildWorkspaceContext() as unknown as ReturnType<
          typeof getWorkspaceContext
        >,
      );
  });

  const setup = (
    callTargets: FakeRecord[],
    createdTargetDefaults?: Record<string, boolean>,
  ) => {
    const repositories: Record<
      string,
      ReturnType<typeof createFakeRepository>
    > = {
      callTarget: createFakeRepository(callTargets),
      person: createFakeRepository([
        { id: 'person-1', companyId: 'company-1' },
        { id: 'person-2', companyId: null },
      ]),
      opportunity: createFakeRepository([
        {
          id: 'opportunity-1',
          companyId: 'company-2',
          pointOfContactId: 'person-1',
        },
      ]),
      service: createFakeRepository([
        { id: 'service-1', companyId: 'company-1' },
      ]),
      pet: createFakeRepository([{ id: 'pet-1', ownerId: 'company-3' }]),
      rocket: createFakeRepository([{ id: 'rocket-1' }]),
    };

    const workspaceOrmManager = {
      executeInWorkspaceContext: async (callback: () => Promise<void>) =>
        callback(),
      getRepository: (objectName: string) => repositories[objectName],
    } as unknown as WorkspaceOrmManager;

    const service = new ActivityTargetCompanyCascadeService(
      workspaceOrmManager,
    );

    const addParentCompanyTargets = (targetIds: string[]) =>
      service.addParentCompanyTargets(
        authContext,
        {
          junctionObjectName: 'callTarget',
          activityIdFieldName: 'callId',
          createdTargetDefaults,
        },
        targetIds.map((id) => ({ id })),
      );

    return { repositories, addParentCompanyTargets };
  };

  it('links the parent company of a person, opportunity and service', async () => {
    const { repositories, addParentCompanyTargets } = setup([
      callTarget('t1', 'call-1', { targetPersonId: 'person-1' }),
      callTarget('t2', 'call-2', { targetOpportunityId: 'opportunity-1' }),
      callTarget('t3', 'call-3', { targetServiceId: 'service-1' }),
    ]);

    await addParentCompanyTargets(['t1', 't2', 't3']);

    expect(repositories.callTarget.insert).toHaveBeenCalledWith(
      [
        { callId: 'call-1', targetCompanyId: 'company-1' },
        { callId: 'call-2', targetCompanyId: 'company-2' },
        { callId: 'call-3', targetCompanyId: 'company-1' },
      ],
      { onConflictDoNothing: true },
    );
  });

  it('links the company of a custom object through its company relation', async () => {
    const { repositories, addParentCompanyTargets } = setup([
      callTarget('t1', 'call-1', { targetPetId: 'pet-1' }),
    ]);

    await addParentCompanyTargets(['t1']);

    expect(repositories.callTarget.insert).toHaveBeenCalledWith(
      [{ callId: 'call-1', targetCompanyId: 'company-3' }],
      { onConflictDoNothing: true },
    );
  });

  it('adds nothing for a custom object without a company relation', async () => {
    const { repositories, addParentCompanyTargets } = setup([
      callTarget('t1', 'call-1', { targetRocketId: 'rocket-1' }),
    ]);

    await addParentCompanyTargets(['t1']);

    expect(repositories.callTarget.insert).not.toHaveBeenCalled();
  });

  it('adds nothing when the activity is logged on a company', async () => {
    const { repositories, addParentCompanyTargets } = setup([
      callTarget('t1', 'call-1', { targetCompanyId: 'company-1' }),
    ]);

    await addParentCompanyTargets(['t1']);

    expect(repositories.callTarget.insert).not.toHaveBeenCalled();
  });

  it('skips a company that is already a target or a record without one', async () => {
    const { repositories, addParentCompanyTargets } = setup([
      callTarget('t1', 'call-1', { targetCompanyId: 'company-1' }),
      callTarget('t2', 'call-1', { targetPersonId: 'person-1' }),
      callTarget('t3', 'call-1', { targetServiceId: 'service-1' }),
      callTarget('t4', 'call-1', { targetPersonId: 'person-2' }),
    ]);

    await addParentCompanyTargets(['t1', 't2', 't3', 't4']);

    expect(repositories.callTarget.insert).not.toHaveBeenCalled();
  });

  it('links a shared parent company only once', async () => {
    const { repositories, addParentCompanyTargets } = setup([
      callTarget('t1', 'call-1', { targetPersonId: 'person-1' }),
      callTarget('t2', 'call-1', { targetServiceId: 'service-1' }),
    ]);

    await addParentCompanyTargets(['t1', 't2']);

    expect(repositories.callTarget.insert).toHaveBeenCalledWith(
      [{ callId: 'call-1', targetCompanyId: 'company-1' }],
      { onConflictDoNothing: true },
    );
  });

  it('does not bring back a company link that was removed', async () => {
    const { repositories, addParentCompanyTargets } = setup([
      callTarget('t1', 'call-1', { targetPersonId: 'person-1' }),
      {
        id: 't2',
        callId: 'call-1',
        targetCompanyId: 'company-1',
        deletedAt: '2026-10-01T00:00:00.000Z',
      },
    ]);

    await addParentCompanyTargets(['t1']);

    expect(repositories.callTarget.insert).not.toHaveBeenCalled();
  });

  it('marks the created company links with the junction defaults', async () => {
    const { repositories, addParentCompanyTargets } = setup(
      [callTarget('t1', 'call-1', { targetPersonId: 'person-1' })],
      { isManuallyAssigned: true, isAutomaticallyAssigned: false },
    );

    await addParentCompanyTargets(['t1']);

    expect(repositories.callTarget.insert).toHaveBeenCalledWith(
      [
        {
          callId: 'call-1',
          targetCompanyId: 'company-1',
          isManuallyAssigned: true,
          isAutomaticallyAssigned: false,
        },
      ],
      { onConflictDoNothing: true },
    );
  });
});
