import {
  BadRequestException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { Args, Field, Int, Mutation, ObjectType, Query } from '@nestjs/graphql';

import { GraphQLJSON } from 'graphql-type-json';
import { isDefined } from 'twenty-shared/utils';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { RoboostNotificationService } from 'src/modules/roboost-notification/services/roboost-notification.service';
import {
  type RoboostNotificationTab,
  type RoboostNotificationType,
} from 'src/modules/roboost-notification/types/roboost-notification.type';

const TABS: RoboostNotificationTab[] = ['UNREAD', 'ALL', 'TRASH'];
const TYPES: RoboostNotificationType[] = ['assign', 'export', 'import', 'task'];
const ACTIONS = ['READ', 'UNREAD', 'TRASH', 'RESTORE', 'DELETE'] as const;

@ObjectType('RoboostNotification')
class RoboostNotificationDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  type: string;

  @Field(() => String)
  subtype: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  body: string;

  @Field(() => String, { nullable: true })
  actorName: string | null;

  @Field(() => String, { nullable: true })
  targetObjectNameSingular: string | null;

  @Field(() => String, { nullable: true })
  targetRecordId: string | null;

  @Field(() => String, { nullable: true })
  targetPath: string | null;

  @Field(() => String, { nullable: true })
  downloadUrl: string | null;

  @Field(() => String, { nullable: true })
  actionLabel: string | null;

  @Field(() => GraphQLJSON)
  relatedRecords: unknown;

  @Field(() => Int)
  relatedCount: number;

  @Field(() => Boolean)
  isRead: boolean;

  @Field(() => Boolean)
  isTrashed: boolean;

  @Field(() => String)
  createdAt: string;
}

@ObjectType('RoboostNotificationPage')
class RoboostNotificationPageDTO {
  @Field(() => [RoboostNotificationDTO])
  items: RoboostNotificationDTO[];

  @Field(() => Boolean)
  hasMore: boolean;
}

@ObjectType('RoboostNotificationCounts')
class RoboostNotificationCountsDTO {
  @Field(() => Int)
  unread: number;

  @Field(() => Int)
  all: number;

  @Field(() => Int)
  trash: number;
}

const parseTab = (tab: string): RoboostNotificationTab => {
  if (!TABS.includes(tab as RoboostNotificationTab)) {
    throw new BadRequestException(`Unknown tab ${tab}`);
  }

  return tab as RoboostNotificationTab;
};

const parseType = (
  type: string | null | undefined,
): RoboostNotificationType | null => {
  if (!isDefined(type) || type === 'all') {
    return null;
  }
  if (!TYPES.includes(type as RoboostNotificationType)) {
    throw new BadRequestException(`Unknown notification type ${type}`);
  }

  return type as RoboostNotificationType;
};

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
export class RoboostNotificationResolver {
  constructor(
    private readonly roboostNotificationService: RoboostNotificationService,
  ) {}

  @Query(() => RoboostNotificationPageDTO)
  async roboostNotifications(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('tab', { type: () => String }) tab: string,
    @Args('type', { type: () => String, nullable: true }) type: string | null,
    @Args('before', { type: () => String, nullable: true })
    before: string | null,
    @Args('limit', { type: () => Int, nullable: true }) limit: number | null,
  ): Promise<RoboostNotificationPageDTO> {
    return this.roboostNotificationService.list({
      workspaceId: workspace.id,
      workspaceMemberId: requireMember(workspaceMemberId),
      tab: parseTab(tab),
      type: parseType(type),
      before: before ?? null,
      limit: limit ?? 30,
    });
  }

  @Query(() => RoboostNotificationCountsDTO)
  async roboostNotificationCounts(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<RoboostNotificationCountsDTO> {
    return this.roboostNotificationService.counts({
      workspaceId: workspace.id,
      workspaceMemberId: requireMember(workspaceMemberId),
    });
  }

  @Mutation(() => Int)
  async roboostUpdateNotifications(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('action', { type: () => String }) action: string,
    @Args('ids', { type: () => [String], nullable: true }) ids: string[] | null,
    @Args('allInTab', { type: () => String, nullable: true })
    allInTab: string | null,
    @Args('type', { type: () => String, nullable: true }) type: string | null,
  ): Promise<number> {
    if (!ACTIONS.includes(action as (typeof ACTIONS)[number])) {
      throw new BadRequestException(`Unknown action ${action}`);
    }

    return this.roboostNotificationService.update({
      workspaceId: workspace.id,
      workspaceMemberId: requireMember(workspaceMemberId),
      action: action as (typeof ACTIONS)[number],
      selection: {
        ids: ids ?? [],
        allInTab: isDefined(allInTab) ? parseTab(allInTab) : null,
        type: parseType(type),
      },
    });
  }
}
