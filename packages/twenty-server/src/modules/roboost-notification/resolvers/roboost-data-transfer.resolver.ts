import {
  BadRequestException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { Args, Field, Int, Mutation, ObjectType, Query } from '@nestjs/graphql';

import { isDefined, isValidUuid } from 'twenty-shared/utils';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import {
  IMPORT_STATES,
  RoboostDataTransferService,
  type RoboostImportState,
} from 'src/modules/roboost-notification/services/roboost-data-transfer.service';
import { RoboostDataTransferNotificationService } from 'src/modules/roboost-notification/services/roboost-data-transfer-notification.service';

@ObjectType('RoboostExport')
class RoboostExportDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  source: string;

  @Field(() => String, { nullable: true })
  objectNameSingular: string | null;

  @Field(() => Int)
  recordCount: number;

  @Field(() => String, { nullable: true })
  userName: string | null;

  @Field(() => String, { nullable: true })
  userEmail: string | null;

  @Field(() => String)
  fileName: string;

  @Field(() => Boolean)
  isAvailable: boolean;

  @Field(() => String)
  createdAt: string;
}

@ObjectType('RoboostExportPage')
class RoboostExportPageDTO {
  @Field(() => [RoboostExportDTO])
  items: RoboostExportDTO[];

  @Field(() => Int)
  total: number;
}

@ObjectType('RoboostImport')
class RoboostImportDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  objectNameSingular: string;

  @Field(() => String)
  state: string;

  @Field(() => Int)
  newCount: number;

  @Field(() => Int)
  updatedCount: number;

  @Field(() => Int)
  newAssociations: number;

  @Field(() => Int)
  errorCount: number;

  @Field(() => Boolean)
  hasErrorFile: boolean;

  @Field(() => Int, { nullable: true })
  duplicateMatchCount?: number | null;

  @Field(() => String, { nullable: true })
  workspaceMemberId: string | null;

  @Field(() => String, { nullable: true })
  createdByName: string | null;

  @Field(() => String)
  createdAt: string;

  @Field(() => String, { nullable: true })
  finishedAt: string | null;
}

@ObjectType('RoboostImportPage')
class RoboostImportPageDTO {
  @Field(() => [RoboostImportDTO])
  items: RoboostImportDTO[];

  @Field(() => Int)
  total: number;
}

@ObjectType('RoboostTransferFile')
class RoboostTransferFileDTO {
  @Field(() => String)
  fileName: string;

  @Field(() => String, { nullable: true })
  content: string | null;
}

@ObjectType('RoboostImportOption')
class RoboostImportOptionDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;
}

@ObjectType('RoboostRecordImportSource')
class RoboostRecordImportSourceDTO {
  @Field(() => Boolean)
  isImport: boolean;

  @Field(() => String, { nullable: true })
  importName: string | null;
}

const OBJECT_NAME_PATTERN = /^[a-z][a-zA-Z0-9]*$/;

const requireMember = (workspaceMemberId: string | undefined) => {
  if (!isDefined(workspaceMemberId)) {
    throw new ForbiddenException('A workspace member is required');
  }

  return workspaceMemberId;
};

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
export class RoboostDataTransferResolver {
  constructor(
    private readonly roboostDataTransferService: RoboostDataTransferService,
    private readonly roboostDataTransferNotificationService: RoboostDataTransferNotificationService,
  ) {}

  @Mutation(() => RoboostExportDTO)
  async roboostLogExport(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('name', { type: () => String }) name: string,
    @Args('source', { type: () => String }) source: string,
    @Args('objectNameSingular', { type: () => String, nullable: true })
    objectNameSingular: string | null,
    @Args('recordCount', { type: () => Int }) recordCount: number,
    @Args('fileName', { type: () => String }) fileName: string,
    @Args('content', { type: () => String }) content: string,
  ): Promise<RoboostExportDTO> {
    const exportRow = await this.roboostDataTransferService.logExport({
      workspaceId: workspace.id,
      workspaceMemberId: requireMember(workspaceMemberId),
      name,
      source,
      objectNameSingular,
      recordCount,
      fileName,
      content,
    });

    await this.roboostDataTransferNotificationService.notifyExport({
      workspaceId: workspace.id,
      exportRow,
    });

    return exportRow;
  }

  @Query(() => RoboostExportPageDTO)
  async roboostExports(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('search', { type: () => String, nullable: true })
    search: string | null,
    @Args('sortDirection', { type: () => String, nullable: true })
    sortDirection: string | null,
    @Args('page', { type: () => Int, nullable: true }) page: number | null,
    @Args('pageSize', { type: () => Int, nullable: true })
    pageSize: number | null,
  ): Promise<RoboostExportPageDTO> {
    return this.roboostDataTransferService.listExports({
      workspaceId: workspace.id,
      search,
      sortDirection: sortDirection === 'ASC' ? 'ASC' : 'DESC',
      page: page ?? 1,
      pageSize: pageSize ?? 20,
    });
  }

  @Query(() => RoboostTransferFileDTO, { nullable: true })
  async roboostExportFile(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('id', { type: () => String }) id: string,
  ): Promise<RoboostTransferFileDTO | null> {
    return this.roboostDataTransferService.getExportFile({
      workspaceId: workspace.id,
      workspaceMemberId: requireMember(workspaceMemberId),
      id,
    });
  }

  @Mutation(() => String)
  async roboostStartImport(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('name', { type: () => String }) name: string,
    @Args('objectNameSingular', { type: () => String })
    objectNameSingular: string,
  ): Promise<string> {
    return this.roboostDataTransferService.startImport({
      workspaceId: workspace.id,
      workspaceMemberId: requireMember(workspaceMemberId),
      name,
      objectNameSingular,
    });
  }

  @Mutation(() => RoboostImportDTO, { nullable: true })
  async roboostFinishImport(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('id', { type: () => String }) id: string,
    @Args('state', { type: () => String }) state: string,
    @Args('newCount', { type: () => Int }) newCount: number,
    @Args('updatedCount', { type: () => Int }) updatedCount: number,
    @Args('newAssociations', { type: () => Int }) newAssociations: number,
    @Args('errorCount', { type: () => Int }) errorCount: number,
    @Args('errorFile', { type: () => String, nullable: true })
    errorFile: string | null,
    @Args('recordIds', { type: () => [String] }) recordIds: string[],
  ): Promise<RoboostImportDTO | null> {
    if (!IMPORT_STATES.includes(state as RoboostImportState)) {
      throw new BadRequestException(`Unknown import state ${state}`);
    }

    const importRow = await this.roboostDataTransferService.finishImport({
      workspaceId: workspace.id,
      workspaceMemberId: requireMember(workspaceMemberId),
      id,
      state: state as RoboostImportState,
      newCount,
      updatedCount,
      newAssociations,
      errorCount,
      errorFile,
      recordIds,
    });

    if (isDefined(importRow)) {
      await this.roboostDataTransferNotificationService.notifyImport({
        workspaceId: workspace.id,
        importRow,
      });
    }

    return importRow;
  }

  @Mutation(() => RoboostImportDTO, { nullable: true })
  async roboostRenameImport(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('id', { type: () => String }) id: string,
    @Args('name', { type: () => String }) name: string,
  ): Promise<RoboostImportDTO | null> {
    if (name.trim() === '') {
      throw new BadRequestException('An import needs a name');
    }

    return this.roboostDataTransferService.renameImport({
      workspaceId: workspace.id,
      id,
      name,
    });
  }

  @Query(() => RoboostImportPageDTO)
  async roboostImports(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('search', { type: () => String, nullable: true })
    search: string | null,
    @Args('objectNameSingular', { type: () => String, nullable: true })
    objectNameSingular: string | null,
    @Args('state', { type: () => String, nullable: true }) state: string | null,
    @Args('createdById', { type: () => String, nullable: true })
    createdById: string | null,
    @Args('createdFrom', { type: () => String, nullable: true })
    createdFrom: string | null,
    @Args('createdTo', { type: () => String, nullable: true })
    createdTo: string | null,
    @Args('page', { type: () => Int, nullable: true }) page: number | null,
    @Args('pageSize', { type: () => Int, nullable: true })
    pageSize: number | null,
  ): Promise<RoboostImportPageDTO> {
    return this.roboostDataTransferService.listImports({
      workspaceId: workspace.id,
      search,
      objectNameSingular,
      state,
      createdById,
      createdFrom,
      createdTo,
      page: page ?? 1,
      pageSize: pageSize ?? 20,
    });
  }

  @Query(() => RoboostTransferFileDTO, { nullable: true })
  async roboostImportErrorFile(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('id', { type: () => String }) id: string,
  ): Promise<RoboostTransferFileDTO | null> {
    return this.roboostDataTransferService.getImportErrorFile(workspace.id, id);
  }

  @Query(() => [RoboostImportOptionDTO])
  async roboostImportOptions(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('objectNameSingular', { type: () => String })
    objectNameSingular: string,
  ): Promise<RoboostImportOptionDTO[]> {
    return this.roboostDataTransferService.listImportOptions(
      workspace.id,
      objectNameSingular,
    );
  }

  @Query(() => [String])
  async roboostImportRecordIds(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('importIds', { type: () => [String] }) importIds: string[],
    @Args('objectNameSingular', { type: () => String })
    objectNameSingular: string,
  ): Promise<string[]> {
    return this.roboostDataTransferService.listImportRecordIds({
      workspaceId: workspace.id,
      importIds,
      objectNameSingular,
    });
  }

  @Query(() => RoboostRecordImportSourceDTO)
  async roboostRecordImportSource(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('objectNameSingular', { type: () => String })
    objectNameSingular: string,
    @Args('recordId', { type: () => String }) recordId: string,
  ): Promise<RoboostRecordImportSourceDTO> {
    if (
      !OBJECT_NAME_PATTERN.test(objectNameSingular) ||
      !isValidUuid(recordId)
    ) {
      throw new BadRequestException('Invalid object name or record id');
    }

    return this.roboostDataTransferService.getRecordImportSource({
      workspaceId: workspace.id,
      objectNameSingular,
      recordId,
    });
  }
}
