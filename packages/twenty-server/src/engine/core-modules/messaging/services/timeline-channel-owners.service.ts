import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { In, type Repository } from 'typeorm';

import { type TimelineChannelOwnerDTO } from 'src/engine/core-modules/messaging/dtos/timeline-channel-owner.dto';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { CalendarChannelEntity } from 'src/engine/metadata-modules/calendar-channel/entities/calendar-channel.entity';
import { ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

@Injectable()
export class TimelineChannelOwnersService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    @InjectRepository(MessageChannelEntity)
    private readonly messageChannelRepository: Repository<MessageChannelEntity>,
    @InjectRepository(CalendarChannelEntity)
    private readonly calendarChannelRepository: Repository<CalendarChannelEntity>,
    @InjectRepository(ConnectedAccountEntity)
    private readonly connectedAccountRepository: Repository<ConnectedAccountEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
  ) {}

  public async getChannelOwners(
    workspaceId: string,
  ): Promise<TimelineChannelOwnerDTO[]> {
    const channelSelect = { id: true, connectedAccountId: true } as const;

    const channels = [
      ...(await this.messageChannelRepository.find({
        where: { workspaceId },
        select: channelSelect,
      })),
      ...(await this.calendarChannelRepository.find({
        where: { workspaceId },
        select: channelSelect,
      })),
    ];

    if (channels.length === 0) {
      return [];
    }

    const connectedAccounts = await this.connectedAccountRepository.find({
      where: {
        id: In([
          ...new Set(channels.map((channel) => channel.connectedAccountId)),
        ]),
        workspaceId,
      },
      select: { id: true, userWorkspaceId: true },
    });

    const userWorkspaces = await this.userWorkspaceRepository.find({
      where: {
        id: In(
          connectedAccounts.map(
            (connectedAccount) => connectedAccount.userWorkspaceId,
          ),
        ),
        workspaceId,
      },
      select: { id: true, userId: true },
    });

    const workspaceMembers =
      await this.workspaceOrmManager.executeInWorkspaceContext(
        async () =>
          this.workspaceOrmManager
            .getRepository<WorkspaceMemberWorkspaceEntity>('workspaceMember', {
              shouldBypassPermissionChecks: true,
            })
            .find({
              where: {
                userId: In(
                  userWorkspaces.map((userWorkspace) => userWorkspace.userId),
                ),
              },
              select: { id: true, userId: true },
            }),
        buildSystemAuthContext(workspaceId),
      );

    const userIdByUserWorkspaceId = new Map(
      userWorkspaces.map((userWorkspace) => [
        userWorkspace.id,
        userWorkspace.userId,
      ]),
    );
    const userWorkspaceIdByConnectedAccountId = new Map(
      connectedAccounts.map((connectedAccount) => [
        connectedAccount.id,
        connectedAccount.userWorkspaceId,
      ]),
    );
    const workspaceMemberIdByUserId = new Map(
      workspaceMembers.map((workspaceMember) => [
        workspaceMember.userId,
        workspaceMember.id,
      ]),
    );

    return channels.flatMap((channel) => {
      const userWorkspaceId = userWorkspaceIdByConnectedAccountId.get(
        channel.connectedAccountId,
      );
      const userId = isDefined(userWorkspaceId)
        ? userIdByUserWorkspaceId.get(userWorkspaceId)
        : undefined;
      const workspaceMemberId = isDefined(userId)
        ? workspaceMemberIdByUserId.get(userId)
        : undefined;

      return isDefined(workspaceMemberId)
        ? [{ channelId: channel.id, workspaceMemberId }]
        : [];
    });
  }
}
