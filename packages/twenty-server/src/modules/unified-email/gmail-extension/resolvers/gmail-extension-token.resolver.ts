import { ForbiddenException, UseGuards } from '@nestjs/common';
import { Args, Field, Mutation, ObjectType, Query } from '@nestjs/graphql';

import { isDefined } from 'twenty-shared/utils';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { GmailExtensionTokenService } from 'src/modules/unified-email/gmail-extension/services/gmail-extension-token.service';

@ObjectType('GmailExtensionToken')
class GmailExtensionTokenDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  createdAt: string;

  @Field(() => String, { nullable: true })
  lastUsedAt: string | null;
}

@ObjectType('CreatedGmailExtensionToken')
class CreatedGmailExtensionTokenDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  token: string;
}

@MetadataResolver()
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: false,
      playground: false,
      workspaceAgnostic: false,
    },
    apiKey: false,
    oauthClient: false,
    application: false,
  }),
  NoPermissionGuard,
)
export class GmailExtensionTokenResolver {
  constructor(
    private readonly gmailExtensionTokenService: GmailExtensionTokenService,
  ) {}

  @Query(() => [GmailExtensionTokenDTO])
  async gmailExtensionTokens(
    @AuthUser() { id: userId }: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<GmailExtensionTokenDTO[]> {
    return this.gmailExtensionTokenService.list({
      userId,
      workspaceId: workspace.id,
    });
  }

  @Mutation(() => CreatedGmailExtensionTokenDTO)
  async createGmailExtensionToken(
    @AuthUser() { id: userId }: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<CreatedGmailExtensionTokenDTO> {
    if (!isDefined(workspaceMemberId)) {
      throw new ForbiddenException('A workspace member is required');
    }

    return this.gmailExtensionTokenService.create({
      userId,
      workspaceId: workspace.id,
      workspaceMemberId,
    });
  }

  @Mutation(() => Boolean)
  async revokeGmailExtensionToken(
    @AuthUser() { id: userId }: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('id', { type: () => String }) id: string,
  ): Promise<boolean> {
    return this.gmailExtensionTokenService.revoke({
      userId,
      workspaceId: workspace.id,
      id,
    });
  }
}
