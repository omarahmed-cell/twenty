import { UseGuards } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { isDefined } from 'twenty-shared/utils';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { type ApiKeyEntity } from 'src/engine/core-modules/api-key/api-key.entity';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthApiKey } from 'src/engine/decorators/auth/auth-api-key.decorator';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PipelineAccessService } from 'src/modules/pipeline/services/pipeline-access.service';
import { PipelineCloneService } from 'src/modules/pipeline/services/pipeline-clone.service';

@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: true,
      workspaceAgnostic: false,
    },
    apiKey: true,
    oauthClient: false,
    application: false,
  }),
)
@MetadataResolver()
export class PipelineResolver {
  constructor(
    private readonly pipelineAccessService: PipelineAccessService,
    private readonly pipelineCloneService: PipelineCloneService,
  ) {}

  @Mutation(() => String)
  @UseGuards(NoPermissionGuard)
  async clonePipeline(
    @Args('pipelineId', { type: () => UUIDScalarType }) pipelineId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId({ allowUndefined: true })
    userWorkspaceId: string | undefined,
    @AuthApiKey() apiKey: ApiKeyEntity | undefined,
  ): Promise<string> {
    const canEdit = await this.pipelineAccessService.canActorEditPipelines({
      workspaceId: workspace.id,
      userWorkspaceId,
      apiKeyId: apiKey?.id,
    });

    if (!canEdit) {
      throw new ForbiddenError('Only workspace admins can change pipelines.');
    }

    const newPipelineId = await this.pipelineCloneService.clonePipeline({
      workspaceId: workspace.id,
      pipelineId,
    });

    if (!isDefined(newPipelineId)) {
      throw new NotFoundError('Pipeline not found');
    }

    return newPipelineId;
  }
}
