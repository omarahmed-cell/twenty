import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import {
  FieldFormulaJob,
  type FieldFormulaJobData,
} from 'src/modules/field-formula/jobs/field-formula.job';
import { FieldFormulaService } from 'src/modules/field-formula/services/field-formula.service';

@MetadataResolver()
@UsePipes(ResolverValidationPipe)
@UseFilters(AuthGraphqlApiExceptionFilter)
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: true,
      workspaceAgnostic: false,
    },
    apiKey: true,
    oauthClient: true,
    application: true,
  }),
  SettingsPermissionGuard(PermissionFlagType.DATA_MODEL),
)
export class FieldFormulaResolver {
  constructor(
    private readonly fieldFormulaService: FieldFormulaService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  // False means the formula is paused: it is invalid, in a loop, or uses a missing field.
  @Mutation(() => Boolean)
  async resyncFormulaField(
    @Args('fieldMetadataId', { type: () => UUIDScalarType })
    fieldMetadataId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    const configs = await this.fieldFormulaService.getConfigs(workspaceId);

    if (
      !configs.some(({ targetFieldId }) => targetFieldId === fieldMetadataId)
    ) {
      return false;
    }

    await this.messageQueueService.add<FieldFormulaJobData>(
      FieldFormulaJob.name,
      { type: 'BACKFILL', workspaceId, targetFieldId: fieldMetadataId },
    );

    return true;
  }
}
