import { UseFilters, UseGuards } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { msg } from '@lingui/core/macro';
import { PermissionFlagType } from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { type ApiKeyEntity } from 'src/engine/core-modules/api-key/api-key.entity';
import { type FlatApplication } from 'src/engine/core-modules/application/types/flat-application.type';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { WorkspaceMemberAccessService } from 'src/engine/core-modules/user-workspace/services/workspace-member-access.service';
import { UserWorkspaceService } from 'src/engine/core-modules/user-workspace/user-workspace.service';
import { PreCreateWorkspaceMemberInput } from 'src/engine/core-modules/user/dtos/pre-create-workspace-member.input';
import { WorkspaceMemberDTO } from 'src/engine/core-modules/user/dtos/workspace-member.dto';
import { WorkspaceMemberTranspiler } from 'src/engine/core-modules/user/services/workspace-member-transpiler.service';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthApiKey } from 'src/engine/decorators/auth/auth-api-key.decorator';
import { AuthApplication } from 'src/engine/decorators/auth/auth-application.decorator';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';
import { UserRoleService } from 'src/engine/metadata-modules/user-role/user-role.service';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

@MetadataResolver()
@UseFilters(PermissionsGraphqlApiExceptionFilter, AuthGraphqlApiExceptionFilter)
export class WorkspaceMemberAccessResolver {
  constructor(
    private readonly workspaceMemberAccessService: WorkspaceMemberAccessService,
    private readonly permissionsService: PermissionsService,
    private readonly userWorkspaceService: UserWorkspaceService,
    private readonly userRoleService: UserRoleService,
    private readonly workspaceMemberTranspiler: WorkspaceMemberTranspiler,
  ) {}

  @Mutation(() => WorkspaceMemberDTO)
  @UseGuards(
    AuthPrincipalGuard({
      userSession: true,
      apiKey: false,
      oauthClient: { withUser: true, withoutUser: false },
      application: { withUser: true, withoutUser: false },
    }),
    CustomPermissionGuard,
  )
  async updateWorkspaceMemberStatus(
    @Args('workspaceMemberId', { type: () => UUIDScalarType })
    workspaceMemberId: string,
    @Args('memberStatus', { type: () => String }) memberStatus: string,
    @AuthUser() user: AuthContextUser,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthApiKey() apiKey: ApiKeyEntity | undefined,
    @AuthApplication({ allowUndefined: true })
    application: FlatApplication | undefined,
  ): Promise<WorkspaceMemberDTO> {
    await this.assertCanManageWorkspaceMembers({
      userWorkspaceId,
      workspace,
      apiKey,
      application,
    });

    const workspaceMember =
      await this.workspaceMemberAccessService.updateWorkspaceMemberStatus({
        workspaceId: workspace.id,
        workspaceMemberId,
        memberStatus,
        actingUserId: user.id,
      });

    return this.toWorkspaceMemberDto({ workspace, workspaceMember });
  }

  @Mutation(() => WorkspaceMemberDTO)
  @UseGuards(
    AuthPrincipalGuard({
      userSession: true,
      apiKey: false,
      oauthClient: { withUser: true, withoutUser: false },
      application: { withUser: true, withoutUser: false },
    }),
    CustomPermissionGuard,
  )
  async preCreateWorkspaceMember(
    @Args('input') input: PreCreateWorkspaceMemberInput,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthApiKey() apiKey: ApiKeyEntity | undefined,
    @AuthApplication({ allowUndefined: true })
    application: FlatApplication | undefined,
  ): Promise<WorkspaceMemberDTO> {
    await this.assertCanManageWorkspaceMembers({
      userWorkspaceId,
      workspace,
      apiKey,
      application,
    });

    const workspaceMember =
      await this.workspaceMemberAccessService.preCreateWorkspaceMember({
        workspaceId: workspace.id,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        memberStatus: input.memberStatus,
      });

    return this.toWorkspaceMemberDto({ workspace, workspaceMember });
  }

  private async assertCanManageWorkspaceMembers({
    userWorkspaceId,
    workspace,
    apiKey,
    application,
  }: {
    userWorkspaceId: string;
    workspace: WorkspaceEntity;
    apiKey: ApiKeyEntity | undefined;
    application: FlatApplication | undefined;
  }): Promise<void> {
    const canManageWorkspaceMembers =
      await this.permissionsService.userHasWorkspaceSettingPermission({
        userWorkspaceId,
        workspaceId: workspace.id,
        setting: PermissionFlagType.WORKSPACE_MEMBERS,
        apiKeyId: apiKey?.id,
        applicationId: application?.id,
        agentId: undefined,
      });

    if (!canManageWorkspaceMembers) {
      throw new PermissionsException(
        PermissionsExceptionMessage.PERMISSION_DENIED,
        PermissionsExceptionCode.PERMISSION_DENIED,
        {
          userFriendlyMessage: msg`You do not have permission to manage workspace members. Please contact your workspace administrator for access.`,
        },
      );
    }
  }

  private async toWorkspaceMemberDto({
    workspace,
    workspaceMember,
  }: {
    workspace: WorkspaceEntity;
    workspaceMember: WorkspaceMemberWorkspaceEntity;
  }): Promise<WorkspaceMemberDTO> {
    const userWorkspace =
      workspaceMember.isPreCreated === true
        ? null
        : await this.userWorkspaceService.getUserWorkspaceForUser({
            userId: workspaceMember.userId,
            workspaceId: workspace.id,
            relations: [],
          });

    const userWorkspaceRoles = isDefined(userWorkspace)
      ? ((
          await this.userRoleService.getRolesByUserWorkspaces({
            userWorkspaceIds: [userWorkspace.id],
            workspaceId: workspace.id,
          })
        ).get(userWorkspace.id) ?? [])
      : [];

    return this.workspaceMemberTranspiler.toWorkspaceMemberDto({
      workspaceId: workspace.id,
      workspaceMemberEntity: workspaceMember,
      userWorkspace: userWorkspace ?? undefined,
      userWorkspaceRoles,
    });
  }
}
