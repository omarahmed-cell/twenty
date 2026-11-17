import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { msg } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { type APP_LOCALES, SOURCE_LOCALE } from 'twenty-shared/translations';
import { OpenRecordIn } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { In, Repository } from 'typeorm';
import { v4 } from 'uuid';

import {
  ForbiddenError,
  NotFoundError,
  UserInputError,
} from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { UserRoleService } from 'src/engine/metadata-modules/user-role/user-role.service';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace-repository';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { STANDARD_ROLE } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-role.constant';
import { WORKSPACE_MEMBER_STATUS } from 'src/modules/workspace-member/constants/workspace-member-status.constant';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';
import {
  getPreCreatedWorkspaceMemberAttachDecision,
  type PreCreatedWorkspaceMemberAttachDecision,
} from 'src/modules/workspace-member/utils/get-pre-created-workspace-member-attach-decision.util';
import { isWorkspaceMemberStatus } from 'src/modules/workspace-member/utils/is-workspace-member-status.util';
import { isValidWorkspaceMemberEmail } from 'src/modules/workspace-member/utils/is-valid-workspace-member-email.util';
import { normalizeWorkspaceMemberEmail } from 'src/modules/workspace-member/utils/normalize-workspace-member-email.util';
import { wouldDeactivationLeaveNoActiveAdmin } from 'src/modules/workspace-member/utils/would-deactivation-leave-no-active-admin.util';

const MAX_PRE_CREATED_USER_ID_ATTEMPTS = 5;

export type PreCreateWorkspaceMemberArgs = {
  workspaceId: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  memberStatus: string;
};

export type PreCreatedWorkspaceMemberMatch = {
  workspaceMember: WorkspaceMemberWorkspaceEntity;
  decision: PreCreatedWorkspaceMemberAttachDecision;
};

@Injectable()
export class WorkspaceMemberAccessService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly userRoleService: UserRoleService,
  ) {}

  private runWithWorkspaceMemberRepository<TResult>(
    workspaceId: string,
    work: (
      workspaceMemberRepository: WorkspaceRepository<WorkspaceMemberWorkspaceEntity>,
    ) => Promise<TResult>,
  ): Promise<TResult> {
    return this.workspaceOrmManager.executeInWorkspaceContext(
      async () =>
        work(
          this.workspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
            'workspaceMember',
            { shouldBypassPermissionChecks: true },
          ),
        ),
      buildSystemAuthContext(workspaceId),
    );
  }

  // Filtered in memory: emails are compared case-insensitively and ILIKE would read "_" as a wildcard
  async findWorkspaceMembersByEmail({
    workspaceId,
    email,
    withDeleted = false,
  }: {
    workspaceId: string;
    email: string;
    withDeleted?: boolean;
  }): Promise<WorkspaceMemberWorkspaceEntity[]> {
    const normalizedEmail = normalizeWorkspaceMemberEmail(email);

    const workspaceMembers = await this.runWithWorkspaceMemberRepository(
      workspaceId,
      (workspaceMemberRepository) =>
        workspaceMemberRepository.find({ withDeleted }),
    );

    return workspaceMembers.filter(
      (workspaceMember) =>
        isNonEmptyString(workspaceMember.userEmail) &&
        normalizeWorkspaceMemberEmail(workspaceMember.userEmail) ===
          normalizedEmail,
    );
  }

  async findWorkspaceMemberByUserId({
    workspaceId,
    userId,
  }: {
    workspaceId: string;
    userId: string;
  }): Promise<WorkspaceMemberWorkspaceEntity | null> {
    return this.runWithWorkspaceMemberRepository(
      workspaceId,
      (workspaceMemberRepository) =>
        workspaceMemberRepository.findOne({ where: { userId } }),
    );
  }

  async isUserIdTaken(userId: string): Promise<boolean> {
    return this.userRepository.exists({
      where: { id: userId },
      withDeleted: true,
    });
  }

  async findPreCreatedWorkspaceMemberMatch({
    workspaceId,
    email,
    isEmailVerified,
  }: {
    workspaceId: string;
    email: string;
    isEmailVerified: boolean;
  }): Promise<PreCreatedWorkspaceMemberMatch | null> {
    const workspaceMember = (
      await this.findWorkspaceMembersByEmail({ workspaceId, email })
    ).find(({ isPreCreated }) => isPreCreated === true);

    if (!isDefined(workspaceMember)) {
      return null;
    }

    return {
      workspaceMember,
      decision: getPreCreatedWorkspaceMemberAttachDecision({
        workspaceMember,
        isEmailVerified,
        isUserIdTaken: await this.isUserIdTaken(workspaceMember.userId),
      }),
    };
  }

  async attachPreCreatedWorkspaceMember({
    workspaceId,
    workspaceMember,
    user,
  }: {
    workspaceId: string;
    workspaceMember: WorkspaceMemberWorkspaceEntity;
    user: Pick<UserEntity, 'id' | 'firstName' | 'lastName'>;
  }): Promise<void> {
    const hasName =
      isNonEmptyString(workspaceMember.name?.firstName?.trim()) ||
      isNonEmptyString(workspaceMember.name?.lastName?.trim());

    // The criteria re-check the attach conditions so a concurrent deactivation or attach wins
    const updateResult = await this.runWithWorkspaceMemberRepository(
      workspaceId,
      (workspaceMemberRepository) =>
        workspaceMemberRepository.update(
          {
            id: workspaceMember.id,
            userId: workspaceMember.userId,
            isPreCreated: true,
            memberStatus: WORKSPACE_MEMBER_STATUS.ACTIVE,
          },
          {
            userId: user.id,
            isPreCreated: false,
            ...(hasName
              ? {}
              : {
                  name: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                  },
                }),
          },
        ),
    );

    if (updateResult.affected !== 1) {
      throw new Error(
        `Pre-created workspace member ${workspaceMember.id} could not be attached to user ${user.id} on workspace ${workspaceId}`,
      );
    }
  }

  async preCreateWorkspaceMember({
    workspaceId,
    firstName,
    lastName,
    email,
    memberStatus,
  }: PreCreateWorkspaceMemberArgs): Promise<WorkspaceMemberWorkspaceEntity> {
    const normalizedEmail = normalizeWorkspaceMemberEmail(email);
    const trimmedFirstName = firstName.trim();

    if (!isWorkspaceMemberStatus(memberStatus)) {
      throw new UserInputError(`Invalid member status: ${memberStatus}`, {
        userFriendlyMessage: msg`Member status must be Active or Deactivated.`,
      });
    }

    if (!isNonEmptyString(trimmedFirstName)) {
      throw new UserInputError('First name is required', {
        userFriendlyMessage: msg`First name is required.`,
      });
    }

    if (!isValidWorkspaceMemberEmail(normalizedEmail)) {
      throw new UserInputError(`Invalid email: ${email}`, {
        userFriendlyMessage: msg`Enter a valid email address.`,
      });
    }

    await this.assertEmailIsFreeInWorkspace({
      workspaceId,
      email: normalizedEmail,
    });

    const userId = await this.generateUnusedUserId();

    const workspaceMember = await this.runWithWorkspaceMemberRepository(
      workspaceId,
      async (workspaceMemberRepository) => {
        await workspaceMemberRepository.insert({
          name: {
            firstName: trimmedFirstName,
            lastName: lastName?.trim() ?? '',
          },
          colorScheme: 'System',
          uiScale: 'Default',
          openRecordIn: OpenRecordIn.SIDE_PANEL,
          userId,
          userEmail: normalizedEmail,
          avatarUrl: null,
          locale: SOURCE_LOCALE as keyof typeof APP_LOCALES,
          isPreCreated: true,
          memberStatus,
        });

        return workspaceMemberRepository.findOneOrFail({
          where: { userId },
        });
      },
    );

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatWorkspaceMemberMaps',
    ]);

    return workspaceMember;
  }

  async updateWorkspaceMemberStatus({
    workspaceId,
    workspaceMemberId,
    memberStatus,
    actingUserId,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
    memberStatus: string;
    actingUserId: string | undefined;
  }): Promise<WorkspaceMemberWorkspaceEntity> {
    if (!isWorkspaceMemberStatus(memberStatus)) {
      throw new UserInputError(`Invalid member status: ${memberStatus}`, {
        userFriendlyMessage: msg`Member status must be Active or Deactivated.`,
      });
    }

    const workspaceMember = await this.runWithWorkspaceMemberRepository(
      workspaceId,
      (workspaceMemberRepository) =>
        workspaceMemberRepository.findOne({ where: { id: workspaceMemberId } }),
    );

    if (!isDefined(workspaceMember)) {
      throw new NotFoundError('Workspace member not found', {
        userFriendlyMessage: msg`Workspace member not found.`,
      });
    }

    if (memberStatus === WORKSPACE_MEMBER_STATUS.DEACTIVATED) {
      await this.assertCanBeDeactivated({
        workspaceId,
        workspaceMember,
        actingUserId,
      });
    }

    const updatedWorkspaceMember = await this.runWithWorkspaceMemberRepository(
      workspaceId,
      async (workspaceMemberRepository) => {
        await workspaceMemberRepository.update(
          { id: workspaceMember.id },
          { memberStatus },
        );

        return workspaceMemberRepository.findOneOrFail({
          where: { id: workspaceMember.id },
        });
      },
    );

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatWorkspaceMemberMaps',
    ]);

    return updatedWorkspaceMember;
  }

  private async assertCanBeDeactivated({
    workspaceId,
    workspaceMember,
    actingUserId,
  }: {
    workspaceId: string;
    workspaceMember: WorkspaceMemberWorkspaceEntity;
    actingUserId: string | undefined;
  }): Promise<void> {
    if (isDefined(actingUserId) && workspaceMember.userId === actingUserId) {
      throw new ForbiddenError('A member cannot deactivate themselves', {
        userFriendlyMessage: msg`You cannot deactivate yourself.`,
      });
    }

    if (workspaceMember.isPreCreated === true) {
      return;
    }

    const userWorkspace = await this.userWorkspaceRepository.findOne({
      where: { userId: workspaceMember.userId, workspaceId },
    });

    if (!isDefined(userWorkspace)) {
      return;
    }

    const roles = (
      await this.userRoleService.getRolesByUserWorkspaces({
        userWorkspaceIds: [userWorkspace.id],
        workspaceId,
      })
    ).get(userWorkspace.id);

    const adminRole = roles?.find(
      (role) =>
        role.universalIdentifier === STANDARD_ROLE.admin.universalIdentifier,
    );

    if (!isDefined(adminRole)) {
      return;
    }

    const adminWorkspaceMembers =
      await this.userRoleService.getWorkspaceMembersAssignedToRole(
        adminRole.id,
        workspaceId,
      );

    if (
      wouldDeactivationLeaveNoActiveAdmin({
        adminWorkspaceMembers,
        workspaceMemberIdToDeactivate: workspaceMember.id,
      })
    ) {
      throw new ForbiddenError(
        'Cannot deactivate the last active admin of the workspace',
        {
          userFriendlyMessage: msg`You cannot deactivate the last active administrator. Please assign another administrator first.`,
        },
      );
    }
  }

  private async assertEmailIsFreeInWorkspace({
    workspaceId,
    email,
  }: {
    workspaceId: string;
    email: string;
  }): Promise<void> {
    // Soft-deleted members still hold the email in the unique index
    const workspaceMembersWithEmail = await this.findWorkspaceMembersByEmail({
      workspaceId,
      email,
      withDeleted: true,
    });

    const usersWithEmail = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id'])
      .where('LOWER("user"."email") = :email', { email })
      .getMany();

    const hasUserWorkspace =
      usersWithEmail.length > 0 &&
      (await this.userWorkspaceRepository.exists({
        where: {
          workspaceId,
          userId: In(usersWithEmail.map(({ id }) => id)),
        },
      }));

    if (workspaceMembersWithEmail.length > 0 || hasUserWorkspace) {
      throw new UserInputError(
        `A workspace member already uses the email ${email}`,
        {
          userFriendlyMessage: msg`A member with this email already exists in this workspace.`,
        },
      );
    }
  }

  private async generateUnusedUserId(): Promise<string> {
    for (
      let attempt = 0;
      attempt < MAX_PRE_CREATED_USER_ID_ATTEMPTS;
      attempt++
    ) {
      const userId = v4();

      if (!(await this.isUserIdTaken(userId))) {
        return userId;
      }
    }

    throw new Error('Could not generate an unused user id');
  }
}
