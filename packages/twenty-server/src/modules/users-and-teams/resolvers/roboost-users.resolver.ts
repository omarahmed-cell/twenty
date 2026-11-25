import { ForbiddenException, UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
} from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';
import { type RoboostUserRole } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type UserEntity } from 'src/engine/core-modules/user/user.entity';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { RoboostUsersService } from 'src/modules/users-and-teams/services/roboost-users.service';

@ObjectType('RoboostMyAccess')
class RoboostMyAccessDTO {
  @Field(() => String, { nullable: true }) workspaceMemberId: string | null;
  @Field(() => Boolean) isAdmin: boolean;
  @Field(() => GraphQLJSON) permissions: unknown;
  @Field(() => [String]) teamIds: string[];
}

@ObjectType('RoboostUser')
class RoboostUserDTO {
  @Field(() => String) workspaceMemberId: string;
  @Field(() => String) name: string;
  @Field(() => String) email: string;
  @Field(() => String, { nullable: true }) avatarUrl: string | null;
  @Field(() => String) memberStatus: string;
  @Field(() => Boolean) isPreCreated: boolean;
  @Field(() => Boolean) hasAccount: boolean;
  @Field(() => String) createdAt: string;
  @Field(() => String) role: string;
  @Field(() => String, { nullable: true }) access: string | null;
  @Field(() => String, { nullable: true }) mainTeamId: string | null;
  @Field(() => String, { nullable: true }) mainTeamName: string | null;
  @Field(() => [String]) additionalTeamNames: string[];
}

@ObjectType('RoboostPendingInvite')
class RoboostPendingInviteDTO {
  @Field(() => String) id: string;
  @Field(() => String) email: string;
  @Field(() => String) role: string;
  @Field(() => String) expiresAt: string;
  @Field(() => String, { nullable: true }) invitedAt: string | null;
}

@ObjectType('RoboostUsersPage')
class RoboostUsersPageDTO {
  @Field(() => Boolean) viewerIsAdmin: boolean;
  @Field(() => [RoboostUserDTO]) users: RoboostUserDTO[];
  @Field(() => [RoboostPendingInviteDTO])
  pendingInvites: RoboostPendingInviteDTO[];
}

@ObjectType('RoboostTeamMember')
class RoboostTeamMemberDTO {
  @Field(() => String) workspaceMemberId: string;
  @Field(() => String) name: string;
  @Field(() => Boolean) isMain: boolean;
}

@ObjectType('RoboostTeam')
class RoboostTeamDTO {
  @Field(() => String) id: string;
  @Field(() => String) name: string;
  @Field(() => String) createdAt: string;
  @Field(() => [RoboostTeamMemberDTO]) members: RoboostTeamMemberDTO[];
}

@ObjectType('RoboostUserPermissionsResult')
class RoboostUserPermissionsDTO {
  @Field(() => String) workspaceMemberId: string;
  @Field(() => String) name: string;
  @Field(() => Boolean) isAdmin: boolean;
  @Field(() => GraphQLJSON) permissions: unknown;
}

@ObjectType('RoboostPermissionHistoryEntry')
class RoboostPermissionHistoryEntryDTO {
  @Field(() => String) id: string;
  @Field(() => String) createdAt: string;
  @Field(() => String, { nullable: true }) actorName: string | null;
  @Field(() => String, { nullable: true }) targetWorkspaceMemberId:
    | string
    | null;
  @Field(() => String) targetLabel: string;
  @Field(() => String) kind: string;
  @Field(() => String) setting: string;
  @Field(() => String, { nullable: true }) fromValue: string | null;
  @Field(() => String, { nullable: true }) toValue: string | null;
}

@InputType('RoboostTeamMemberInput')
class RoboostTeamMemberInput {
  @Field(() => String) workspaceMemberId: string;
  @Field(() => Boolean) isMain: boolean;
}

const toRole = (role: string): RoboostUserRole =>
  role === 'ADMIN' ? 'ADMIN' : 'MEMBER';

@MetadataResolver()
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: false,
      workspaceAgnostic: false,
    },
    apiKey: false,
    oauthClient: false,
    application: false,
  }),
  NoPermissionGuard,
)
export class RoboostUsersResolver {
  constructor(private readonly roboostUsersService: RoboostUsersService) {}

  @Query(() => RoboostMyAccessDTO)
  async roboostMyAccess(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<RoboostMyAccessDTO> {
    if (!isDefined(workspaceMemberId)) {
      return {
        workspaceMemberId: null,
        isAdmin: false,
        permissions: {},
        teamIds: [],
      };
    }

    const [access, teams] = await Promise.all([
      this.roboostUsersService.ensureProvisioned(
        workspace.id,
        workspaceMemberId,
      ),
      this.roboostUsersService.listTeams(workspace.id),
    ]);

    return {
      workspaceMemberId,
      isAdmin: access.isAdmin,
      permissions: access.permissions,
      teamIds: teams
        .filter((team) =>
          team.members.some(
            (member) => member.workspaceMemberId === workspaceMemberId,
          ),
        )
        .map((team) => team.id),
    };
  }

  @Query(() => RoboostUsersPageDTO)
  async roboostUsers(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<RoboostUsersPageDTO> {
    const viewerIsAdmin = await this.assertCanSeeUserTable(
      workspace.id,
      workspaceMemberId,
    );
    const users = await this.roboostUsersService.listUsers({
      workspaceId: workspace.id,
      includeAccess: viewerIsAdmin,
    });

    return {
      viewerIsAdmin,
      users: users.map((user) => ({
        workspaceMemberId: user.workspaceMemberId,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        memberStatus: user.memberStatus,
        isPreCreated: user.isPreCreated,
        hasAccount: isDefined(user.userWorkspaceId),
        createdAt: user.createdAt,
        role: user.isAdmin ? 'ADMIN' : 'MEMBER',
        access: user.access,
        mainTeamId: user.mainTeamId,
        mainTeamName: user.mainTeamName,
        additionalTeamNames: user.additionalTeamNames,
      })),
      pendingInvites: viewerIsAdmin
        ? await this.roboostUsersService.listPendingInvites(workspace)
        : [],
    };
  }

  @Query(() => [RoboostTeamDTO])
  async roboostTeams(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.roboostUsersService.listTeams(workspace.id);
  }

  @Query(() => RoboostUserPermissionsDTO)
  async roboostUserPermissions(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() actorMemberId: string | undefined,
    @Args('workspaceMemberId', { type: () => String })
    workspaceMemberId: string,
  ): Promise<RoboostUserPermissionsDTO> {
    await this.roboostUsersService.assertAdmin(workspace.id, actorMemberId);

    const member = await this.roboostUsersService.findMemberOrThrow(
      workspace.id,
      workspaceMemberId,
    );

    return {
      workspaceMemberId,
      name: member.name,
      isAdmin: member.isAdmin,
      permissions: await this.roboostUsersService.getPermissions(
        workspace.id,
        workspaceMemberId,
      ),
    };
  }

  @Query(() => [RoboostPermissionHistoryEntryDTO])
  async roboostPermissionHistory(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() actorMemberId: string | undefined,
    @Args('workspaceMemberId', { type: () => String, nullable: true })
    workspaceMemberId: string | null,
    @Args('from', { type: () => String, nullable: true }) from: string | null,
    @Args('to', { type: () => String, nullable: true }) to: string | null,
  ) {
    await this.roboostUsersService.assertAdmin(workspace.id, actorMemberId);

    return this.roboostUsersService.listHistory({
      workspaceId: workspace.id,
      targetWorkspaceMemberId: workspaceMemberId,
      from,
      to,
    });
  }

  @Mutation(() => Boolean)
  async roboostSetUserAdmin(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() actorMemberId: string | undefined,
    @Args('workspaceMemberId', { type: () => String })
    workspaceMemberId: string,
    @Args('isAdmin', { type: () => Boolean }) isAdmin: boolean,
  ) {
    await this.roboostUsersService.assertAdmin(workspace.id, actorMemberId);
    await this.roboostUsersService.setAdmin({
      workspaceId: workspace.id,
      actor: await this.roboostUsersService.resolveActor(
        workspace.id,
        actorMemberId,
      ),
      workspaceMemberId,
      isAdmin,
    });

    return true;
  }

  @Mutation(() => GraphQLJSON)
  async roboostSaveUserPermissions(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() actorMemberId: string | undefined,
    @Args('workspaceMemberId', { type: () => String })
    workspaceMemberId: string,
    @Args('permissions', { type: () => GraphQLJSON }) permissions: unknown,
  ) {
    await this.roboostUsersService.assertAdmin(workspace.id, actorMemberId);

    return this.roboostUsersService.savePermissions({
      workspaceId: workspace.id,
      actor: await this.roboostUsersService.resolveActor(
        workspace.id,
        actorMemberId,
      ),
      workspaceMemberId,
      permissions,
    });
  }

  @Mutation(() => Boolean)
  async roboostCopyPermissions(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() actorMemberId: string | undefined,
    @Args('fromWorkspaceMemberId', { type: () => String })
    fromWorkspaceMemberId: string,
    @Args('toWorkspaceMemberIds', { type: () => [String] })
    toWorkspaceMemberIds: string[],
  ) {
    await this.roboostUsersService.assertAdmin(workspace.id, actorMemberId);
    await this.roboostUsersService.copyPermissions({
      workspaceId: workspace.id,
      actor: await this.roboostUsersService.resolveActor(
        workspace.id,
        actorMemberId,
      ),
      fromWorkspaceMemberId,
      toWorkspaceMemberIds,
    });

    return true;
  }

  @Mutation(() => Boolean)
  async roboostInviteUsers(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() actorMemberId: string | undefined,
    @Args('emails', { type: () => [String] }) emails: string[],
    @Args('role', { type: () => String }) role: string,
    @Args('copyFromWorkspaceMemberId', { type: () => String, nullable: true })
    copyFromWorkspaceMemberId: string | null,
  ) {
    await this.roboostUsersService.assertAdmin(workspace.id, actorMemberId);

    const result = await this.roboostUsersService.inviteUsers({
      workspace,
      actor: await this.roboostUsersService.resolveActor(
        workspace.id,
        actorMemberId,
      ),
      emails,
      role: toRole(role),
      copyFromWorkspaceMemberId,
    });

    if (!result.success) {
      throw new ForbiddenException(
        result.errors?.join(', ') ?? 'Invitations could not be sent',
      );
    }

    return true;
  }

  @Mutation(() => Boolean)
  async roboostSetUserStatus(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: UserEntity,
    @AuthWorkspaceMemberId() actorMemberId: string | undefined,
    @Args('workspaceMemberId', { type: () => String })
    workspaceMemberId: string,
    @Args('memberStatus', { type: () => String }) memberStatus: string,
  ) {
    await this.roboostUsersService.assertAdmin(workspace.id, actorMemberId);
    await this.roboostUsersService.setStatus({
      workspaceId: workspace.id,
      actor: await this.roboostUsersService.resolveActor(
        workspace.id,
        actorMemberId,
      ),
      actingUserId: user?.id,
      workspaceMemberId,
      memberStatus: memberStatus === 'DEACTIVATED' ? 'DEACTIVATED' : 'ACTIVE',
    });

    return true;
  }

  @Mutation(() => String)
  async roboostSaveTeam(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() actorMemberId: string | undefined,
    @Args('teamId', { type: () => String, nullable: true })
    teamId: string | null,
    @Args('name', { type: () => String }) name: string,
    @Args('members', { type: () => [RoboostTeamMemberInput] })
    members: RoboostTeamMemberInput[],
  ) {
    await this.roboostUsersService.assertAdmin(workspace.id, actorMemberId);

    return this.roboostUsersService.saveTeam({
      workspaceId: workspace.id,
      actor: await this.roboostUsersService.resolveActor(
        workspace.id,
        actorMemberId,
      ),
      teamId,
      name,
      members,
    });
  }

  @Mutation(() => Boolean)
  async roboostDeleteTeam(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() actorMemberId: string | undefined,
    @Args('teamId', { type: () => String }) teamId: string,
  ) {
    await this.roboostUsersService.assertAdmin(workspace.id, actorMemberId);
    await this.roboostUsersService.deleteTeam({
      workspaceId: workspace.id,
      actor: await this.roboostUsersService.resolveActor(
        workspace.id,
        actorMemberId,
      ),
      teamId,
    });

    return true;
  }

  @Mutation(() => Boolean)
  async roboostSetUserTeams(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() actorMemberId: string | undefined,
    @Args('workspaceMemberId', { type: () => String })
    workspaceMemberId: string,
    @Args('mainTeamId', { type: () => String, nullable: true })
    mainTeamId: string | null,
    @Args('additionalTeamIds', { type: () => [String] })
    additionalTeamIds: string[],
  ) {
    await this.roboostUsersService.assertAdmin(workspace.id, actorMemberId);
    await this.roboostUsersService.setUserTeams({
      workspaceId: workspace.id,
      actor: await this.roboostUsersService.resolveActor(
        workspace.id,
        actorMemberId,
      ),
      workspaceMemberId,
      mainTeamId,
      additionalTeamIds,
    });

    return true;
  }

  // Admins see everything; members only with User table access, and never anyone's permissions
  private async assertCanSeeUserTable(
    workspaceId: string,
    workspaceMemberId: string | undefined,
  ): Promise<boolean> {
    if (!isDefined(workspaceMemberId)) {
      throw new ForbiddenException('Not allowed');
    }

    const access = await this.roboostUsersService.ensureProvisioned(
      workspaceId,
      workspaceMemberId,
    );

    if (access.isAdmin) {
      return true;
    }

    if (access.permissions.toggles.userTableAccess !== true) {
      throw new ForbiddenException('Not allowed');
    }

    return false;
  }
}
