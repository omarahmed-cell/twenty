import { Injectable } from '@nestjs/common';

import { MessageChannelType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import {
  type Participant,
  type ParticipantWithMessageId,
} from 'src/modules/messaging/message-import-manager/drivers/gmail/types/gmail-message.type';
import { MessagingMessageFolderAssociationService } from 'src/modules/messaging/message-import-manager/services/messaging-message-folder-association.service';
import { MessagingMessageService } from 'src/modules/messaging/message-import-manager/services/messaging-message.service';
import { type MessageChannelMessageAssociationFolderAssociation } from 'src/modules/messaging/message-import-manager/types/message-channel-message-association-folder-association.type';
import { type MessageWithParticipants } from 'src/modules/messaging/message-import-manager/types/message.type';
import { MessagingMessageParticipantService } from 'src/modules/messaging/message-participant-manager/services/messaging-message-participant.service';

@Injectable()
export class MessagingSaveMessagesAndEnqueueContactCreationService {
  constructor(
    private readonly messageService: MessagingMessageService,
    private readonly messageParticipantService: MessagingMessageParticipantService,
    private readonly messageFolderAssociationService: MessagingMessageFolderAssociationService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
  ) {}

  async saveMessagesAndEnqueueContactCreation(
    messagesToSave: MessageWithParticipants[],
    messageChannel: MessageChannelEntity,
    _connectedAccount: ConnectedAccountEntity,
    workspaceId: string,
  ): Promise<
    | {
        messageExternalIdsAndIdsMap: Map<string, string>;
        messageExternalIdToMessageThreadIdMap: Map<string, string>;
      }
    | undefined
  > {
    const authContext = buildSystemAuthContext(workspaceId);

    const savedMessagesResult =
      await this.workspaceOrmManager.executeInWorkspaceContext(
        async () => {
          return this.workspaceOrmManager.runInWorkspaceTransaction(
            async (transactionScope) => {
              const {
                messageExternalIdsAndIdsMap,
                messageExternalIdToMessageChannelMessageAssociationIdMap,
                messageExternalIdToMessageThreadIdMap,
              } = await this.messageService.saveMessagesWithinTransaction(
                messagesToSave,
                messageChannel.id,
                transactionScope,
                workspaceId,
              );

              const participantsWithMessageId: ParticipantWithMessageId[] =
                messagesToSave.flatMap((message) => {
                  const messageId = messageExternalIdsAndIdsMap.get(
                    message.externalId,
                  );

                  return messageId
                    ? message.participants.map((participant: Participant) => ({
                        ...participant,
                        messageId,
                      }))
                    : [];
                });

              const savedMessageParticipants =
                await this.messageParticipantService.saveMessageParticipants(
                  participantsWithMessageId,
                  workspaceId,
                  transactionScope,
                );

              const folderAssociations: MessageChannelMessageAssociationFolderAssociation[] =
                messagesToSave.flatMap((message) => {
                  const messageFolderIds = message.messageFolderIds ?? [];

                  if (messageFolderIds.length === 0) {
                    return [];
                  }

                  const associationId =
                    messageExternalIdToMessageChannelMessageAssociationIdMap.get(
                      message.externalId,
                    );

                  if (!isDefined(associationId)) {
                    return [];
                  }

                  return [
                    {
                      messageChannelMessageAssociationId: associationId,
                      messageFolderIds,
                    },
                  ];
                });

              await this.messageFolderAssociationService.saveMessageFolderAssociations(
                folderAssociations,
                workspaceId,
                transactionScope,
              );

              return {
                participantsWithMessageId,
                savedMessageParticipants,
                messageExternalIdsAndIdsMap,
                messageExternalIdToMessageThreadIdMap,
              };
            },
          );
        },
        authContext,
        { lite: true },
      );

    if (!isDefined(savedMessagesResult)) {
      return undefined;
    }

    const messageIds = [
      ...new Set(
        savedMessagesResult.participantsWithMessageId.map(
          ({ messageId }) => messageId,
        ),
      ),
    ];

    // Matching non-email handles as emails would null out caller-supplied identities, so those channels only reconcile targets
    await this.messageParticipantService.matchMessageParticipants({
      participants: savedMessagesResult.savedMessageParticipants,
      messageIds,
      workspaceId,
      matchWith:
        messageChannel.type === MessageChannelType.APP
          ? 'targetsOnly'
          : 'workspaceMemberAndPerson',
    });

    return {
      messageExternalIdsAndIdsMap:
        savedMessagesResult.messageExternalIdsAndIdsMap,
      messageExternalIdToMessageThreadIdMap:
        savedMessagesResult.messageExternalIdToMessageThreadIdMap,
    };
  }
}
