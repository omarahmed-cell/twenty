import { type FindOperator } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { ActivityTargetCompanyCascadeService } from 'src/modules/activity-target/query-hooks/activity-target-company-cascade.service';

type FakeRecord = Record<string, string | null>;

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
  records,
  find: jest.fn(
    async ({ where }: { where: Record<string, FindOperator<unknown>> }) =>
      records.filter((record) =>
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

const emptyTarget = {
  targetPersonId: null,
  targetCompanyId: null,
  targetOpportunityId: null,
  targetServiceId: null,
};

describe('ActivityTargetCompanyCascadeService', () => {
  const setup = (callTargets: FakeRecord[]) => {
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
        { id: 'opportunity-1', companyId: 'company-2' },
      ]),
      service: createFakeRepository([
        { id: 'service-1', companyId: 'company-1' },
      ]),
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
        { junctionObjectName: 'callTarget', activityIdFieldName: 'callId' },
        targetIds.map((id) => ({ id })),
      );

    return { repositories, addParentCompanyTargets };
  };

  it('links the parent company of a person, opportunity and service', async () => {
    const { repositories, addParentCompanyTargets } = setup([
      {
        ...emptyTarget,
        id: 't1',
        callId: 'call-1',
        targetPersonId: 'person-1',
      },
      {
        ...emptyTarget,
        id: 't2',
        callId: 'call-2',
        targetOpportunityId: 'opportunity-1',
      },
      {
        ...emptyTarget,
        id: 't3',
        callId: 'call-3',
        targetServiceId: 'service-1',
      },
    ]);

    await addParentCompanyTargets(['t1', 't2', 't3']);

    expect(repositories.callTarget.insert).toHaveBeenCalledWith([
      { callId: 'call-1', targetCompanyId: 'company-1' },
      { callId: 'call-2', targetCompanyId: 'company-2' },
      { callId: 'call-3', targetCompanyId: 'company-1' },
    ]);
  });

  it('adds nothing when the activity is logged on a company', async () => {
    const { repositories, addParentCompanyTargets } = setup([
      {
        ...emptyTarget,
        id: 't1',
        callId: 'call-1',
        targetCompanyId: 'company-1',
      },
    ]);

    await addParentCompanyTargets(['t1']);

    expect(repositories.callTarget.insert).not.toHaveBeenCalled();
  });

  it('skips a company that is already a target or the record has none', async () => {
    const { repositories, addParentCompanyTargets } = setup([
      {
        ...emptyTarget,
        id: 't1',
        callId: 'call-1',
        targetCompanyId: 'company-1',
      },
      {
        ...emptyTarget,
        id: 't2',
        callId: 'call-1',
        targetPersonId: 'person-1',
      },
      {
        ...emptyTarget,
        id: 't3',
        callId: 'call-1',
        targetServiceId: 'service-1',
      },
      {
        ...emptyTarget,
        id: 't4',
        callId: 'call-1',
        targetPersonId: 'person-2',
      },
    ]);

    await addParentCompanyTargets(['t1', 't2', 't3', 't4']);

    expect(repositories.callTarget.insert).not.toHaveBeenCalled();
  });

  it('links a shared parent company only once', async () => {
    const { repositories, addParentCompanyTargets } = setup([
      {
        ...emptyTarget,
        id: 't1',
        callId: 'call-1',
        targetPersonId: 'person-1',
      },
      {
        ...emptyTarget,
        id: 't2',
        callId: 'call-1',
        targetServiceId: 'service-1',
      },
    ]);

    await addParentCompanyTargets(['t1', 't2']);

    expect(repositories.callTarget.insert).toHaveBeenCalledWith([
      { callId: 'call-1', targetCompanyId: 'company-1' },
    ]);
  });
});
