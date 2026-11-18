import { Injectable } from '@nestjs/common';

import { v4 } from 'uuid';
import { EntityManager } from 'typeorm';

import {
  MessageChannelPendingGroupEmailsAction,
  MessageChannelSyncStage,
  MessageChannelSyncStatus,
  MessageChannelType,
  MessageChannelVisibility,
  FeatureFlagKey,
} from 'twenty-shared/types';
import { FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { LOCKED_MESSAGE_CHANNEL_CONTACT_AUTO_CREATION } from 'src/engine/metadata-modules/message-channel/constants/locked-message-channel-contact-auto-creation.constant';

export type CreateMessageChannelInput = {
  workspaceId: string;
  connectedAccountId: string;
  handle: string;
  messageVisibility?: MessageChannelVisibility;
  skipMessageChannelConfiguration?: boolean;
  transactionManager: EntityManager;
};

@Injectable()
export class CreateMessageChannelService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async createMessageChannel(
    input: CreateMessageChannelInput,
  ): Promise<string> {
    const {
      workspaceId,
      connectedAccountId,
      handle,
      messageVisibility,
      skipMessageChannelConfiguration,
      transactionManager,
    } = input;

    const authContext = buildSystemAuthContext(workspaceId);

    // The channel is still needed to send email, it just never syncs the mailbox
    const isUnifiedEmailEnabled =
      await this.featureFlagService.isFeatureEnabled(
        FeatureFlagKey.IS_UNIFIED_EMAIL_ENABLED,
        workspaceId,
      );

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const messageChannelRepo =
        transactionManager.getRepository(MessageChannelEntity);
      const newMessageChannelId = v4();

      await messageChannelRepo.save({
        id: newMessageChannelId,
        connectedAccountId,
        type: MessageChannelType.EMAIL,
        handle,
        visibility: messageVisibility || MessageChannelVisibility.METADATA,
        syncStatus: skipMessageChannelConfiguration
          ? MessageChannelSyncStatus.ONGOING
          : MessageChannelSyncStatus.NOT_SYNCED,
        syncStage: skipMessageChannelConfiguration
          ? MessageChannelSyncStage.MESSAGE_LIST_FETCH_PENDING
          : MessageChannelSyncStage.PENDING_CONFIGURATION,
        pendingGroupEmailsAction: MessageChannelPendingGroupEmailsAction.NONE,
        ...LOCKED_MESSAGE_CHANNEL_CONTACT_AUTO_CREATION,
        ...(isUnifiedEmailEnabled ? { isSyncEnabled: false } : {}),
        workspaceId,
      });

      return newMessageChannelId;
    }, authContext);
  }
}
