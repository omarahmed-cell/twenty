import { WorkspaceMemberAccessService } from 'src/engine/core-modules/user-workspace/services/workspace-member-access.service';
import { UserWorkspaceService } from 'src/engine/core-modules/user-workspace/user-workspace.service';
import { type UserEntity } from 'src/engine/core-modules/user/user.entity';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

type StoredWorkspaceMember = {
  id: string;
  userId: string;
  userEmail: string;
  isPreCreated: boolean;
  memberStatus: 'ACTIVE' | 'DEACTIVATED';
  name: { firstName: string; lastName: string };
};

const WORKSPACE = {
  id: 'workspace-id',
  defaultRoleId: 'default-role-id',
} as WorkspaceEntity;

const buildUser = (isEmailVerified: boolean) =>
  ({
    id: 'signing-in-user-id',
    email: 'sara@roboost.app',
    firstName: 'Sara',
    lastName: 'Google',
    locale: 'en',
    isEmailVerified,
  }) as UserEntity;

const matchesCriteria = (
  workspaceMember: StoredWorkspaceMember,
  criteria: Partial<StoredWorkspaceMember>,
) =>
  Object.entries(criteria).every(
    ([key, value]) =>
      workspaceMember[key as keyof StoredWorkspaceMember] === value,
  );

const setup = (workspaceMembers: StoredWorkspaceMember[]) => {
  const workspaceMemberRepository = {
    find: jest.fn(
      async (options?: { where?: Partial<StoredWorkspaceMember> }) =>
        workspaceMembers.filter((workspaceMember) =>
          matchesCriteria(workspaceMember, options?.where ?? {}),
        ),
    ),
    findOne: jest.fn(
      async ({ where }: { where: Partial<StoredWorkspaceMember> }) =>
        workspaceMembers.find((workspaceMember) =>
          matchesCriteria(workspaceMember, where),
        ) ?? null,
    ),
    insert: jest.fn(async (workspaceMember: StoredWorkspaceMember) => {
      workspaceMembers.push(workspaceMember);
    }),
    update: jest.fn(
      async (
        criteria: Partial<StoredWorkspaceMember>,
        partialWorkspaceMember: Partial<StoredWorkspaceMember>,
      ) => {
        const matchingMembers = workspaceMembers.filter((workspaceMember) =>
          matchesCriteria(workspaceMember, criteria),
        );

        matchingMembers.forEach((workspaceMember) =>
          Object.assign(workspaceMember, partialWorkspaceMember),
        );

        return { affected: matchingMembers.length };
      },
    ),
  };

  const workspaceOrmManager = {
    executeInWorkspaceContext: jest.fn(async (work: () => unknown) => work()),
    getRepository: jest.fn(() => workspaceMemberRepository),
  };

  const userWorkspaceRepository = {
    findOneBy: jest.fn(async () => null),
    findOne: jest.fn(async () => null),
    findOneOrFail: jest.fn(async () => ({ defaultAvatarUrl: null })),
    create: jest.fn((userWorkspace: object) => userWorkspace),
    save: jest.fn(async (userWorkspace: object) => ({
      ...userWorkspace,
      id: 'new-user-workspace-id',
    })),
    delete: jest.fn(),
  };

  const userRepository = { exists: jest.fn(async () => false) };
  const workspaceCacheService = { invalidateAndRecompute: jest.fn() };
  const userRoleService = { assignRoleToManyUserWorkspace: jest.fn() };

  const workspaceMemberAccessService = new WorkspaceMemberAccessService(
    userRepository as never,
    userWorkspaceRepository as never,
    workspaceOrmManager as never,
    workspaceCacheService as never,
    userRoleService as never,
  );

  const userWorkspaceService = new UserWorkspaceService(
    userWorkspaceRepository as never,
    userRepository as never,
    {} as never,
    {} as never,
    { invalidateWorkspaceInvitation: jest.fn() } as never,
    {} as never,
    {} as never,
    {} as never,
    workspaceOrmManager as never,
    userRoleService as never,
    {} as never,
    {} as never,
    { setOnboardingCreateProfilePending: jest.fn() } as never,
    {} as never,
    {} as never,
    {} as never,
    workspaceCacheService as never,
    workspaceMemberAccessService,
  );

  return {
    userWorkspaceService,
    workspaceMemberRepository,
    userWorkspaceRepository,
    userRoleService,
  };
};

const buildPreCreatedMember = (
  overrides: Partial<StoredWorkspaceMember> = {},
): StoredWorkspaceMember => ({
  id: 'pre-created-member-id',
  userId: 'placeholder-user-id',
  userEmail: 'Sara@Roboost.app',
  isPreCreated: true,
  memberStatus: 'ACTIVE',
  name: { firstName: 'Sara', lastName: 'Ali' },
  ...overrides,
});

describe('UserWorkspaceService with a pre-created member', () => {
  it('attaches the pre-created member on a verified first sign-in without inserting a duplicate', async () => {
    const workspaceMembers = [buildPreCreatedMember()];
    const { userWorkspaceService, workspaceMemberRepository, userRoleService } =
      setup(workspaceMembers);

    await userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace(
      buildUser(true),
      WORKSPACE,
    );

    expect(workspaceMemberRepository.insert).not.toHaveBeenCalled();
    expect(workspaceMembers).toEqual([
      buildPreCreatedMember({
        userId: 'signing-in-user-id',
        isPreCreated: false,
      }),
    ]);
    expect(userRoleService.assignRoleToManyUserWorkspace).toHaveBeenCalledWith({
      workspaceId: WORKSPACE.id,
      userWorkspaceIds: ['new-user-workspace-id'],
      roleId: WORKSPACE.defaultRoleId,
    });
  });

  it('attaches when only the sign-in provider verified the email', async () => {
    const workspaceMembers = [buildPreCreatedMember()];
    const { userWorkspaceService } = setup(workspaceMembers);

    await userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace(
      buildUser(false),
      WORKSPACE,
      undefined,
      { isEmailVerifiedByAuthProvider: true },
    );

    expect(workspaceMembers[0].userId).toBe('signing-in-user-id');
  });

  it('refuses an unverified sign-in without attaching or inserting', async () => {
    const workspaceMembers = [buildPreCreatedMember()];
    const {
      userWorkspaceService,
      workspaceMemberRepository,
      userWorkspaceRepository,
    } = setup(workspaceMembers);

    await expect(
      userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace(
        buildUser(false),
        WORKSPACE,
      ),
    ).rejects.toMatchObject({
      message: 'Verify your email to join this workspace',
    });

    expect(workspaceMembers).toEqual([buildPreCreatedMember()]);
    expect(workspaceMemberRepository.insert).not.toHaveBeenCalled();
    expect(userWorkspaceRepository.save).not.toHaveBeenCalled();
  });

  it('refuses a deactivated pre-created member without attaching', async () => {
    const workspaceMembers = [
      buildPreCreatedMember({ memberStatus: 'DEACTIVATED' }),
    ];
    const { userWorkspaceService, userWorkspaceRepository } =
      setup(workspaceMembers);

    await expect(
      userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace(
        buildUser(true),
        WORKSPACE,
      ),
    ).rejects.toMatchObject({ message: 'This member has been deactivated' });

    expect(workspaceMembers[0].userId).toBe('placeholder-user-id');
    expect(userWorkspaceRepository.save).not.toHaveBeenCalled();
  });

  it('never attaches a pre-created member on a .invalid email', async () => {
    const workspaceMembers = [
      buildPreCreatedMember({ userEmail: 'sara@roboost.invalid' }),
    ];
    const { userWorkspaceService } = setup(workspaceMembers);

    await expect(
      userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace(
        { ...buildUser(true), email: 'sara@roboost.invalid' } as UserEntity,
        WORKSPACE,
      ),
    ).rejects.toBeDefined();

    expect(workspaceMembers[0].userId).toBe('placeholder-user-id');
  });

  it('never touches a real member that shares the email', async () => {
    const realMember = buildPreCreatedMember({
      id: 'real-member-id',
      userId: 'other-user-id',
      isPreCreated: false,
    });
    const workspaceMembers = [realMember];
    const { userWorkspaceService, workspaceMemberRepository } =
      setup(workspaceMembers);

    await userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace(
      buildUser(true),
      WORKSPACE,
    );

    expect(workspaceMemberRepository.update).not.toHaveBeenCalled();
    expect(workspaceMembers[0]).toEqual(realMember);
  });
});
