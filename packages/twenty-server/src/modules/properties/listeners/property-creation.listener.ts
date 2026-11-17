import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { isNonEmptyString } from '@sniptt/guards';
import { type ActorMetadata, FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { In } from 'typeorm';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type MetadataEventBatch } from 'src/engine/subscriptions/metadata-event/types/metadata-event-batch.type';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { PropertyLogicConfigService } from 'src/modules/properties/services/property-logic-config.service';
import { type PropertyCreationWorkspaceEntity } from 'src/modules/properties/standard-objects/property-creation.workspace-entity';
import { type PropertyGroupMembershipWorkspaceEntity } from 'src/modules/properties/standard-objects/property-group-membership.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

type FieldMetadataEventBatch = MetadataEventBatch<
  'fieldMetadata',
  'created' | 'deleted'
>;

const getEventFields = (
  payload: FieldMetadataEventBatch,
  key: 'after' | 'before',
): FlatFieldMetadata[] =>
  payload.events.flatMap((event) => {
    const properties = event.properties as Record<string, unknown>;
    const field = properties[key] as FlatFieldMetadata | undefined;

    return isDefined(field) ? [field] : [];
  });

// Fields made by the system (upgrades, apps) have no person or API key behind them and stay "Unknown"
@Injectable()
export class PropertyCreationListener {
  private readonly logger = new Logger(PropertyCreationListener.name);

  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly propertyLogicConfigService: PropertyLogicConfigService,
  ) {}

  @OnEvent('metadata.fieldMetadata.created')
  async handleFieldCreated(payload: FieldMetadataEventBatch) {
    const isByApiKey = isNonEmptyString(payload.apiKeyId);

    if (!isNonEmptyString(payload.userId) && !isByApiKey) {
      return;
    }

    const fields = getEventFields(payload, 'after');

    if (fields.length === 0) {
      return;
    }

    try {
      await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
        const createdBy: ActorMetadata | null = isByApiKey
          ? {
              source: FieldActorSource.API,
              name: 'API',
              workspaceMemberId: null,
              context: {},
            }
          : await this.findMemberActor(payload.userId as string);

        if (!isDefined(createdBy)) {
          return;
        }

        await this.workspaceOrmManager
          .getRepository<PropertyCreationWorkspaceEntity>('propertyCreation', {
            shouldBypassPermissionChecks: true,
          })
          .insert(
            fields.map((field) => ({
              fieldMetadataId: field.id,
              objectMetadataId: field.objectMetadataId,
              createdBy,
            })),
          );
      }, buildSystemAuthContext(payload.workspaceId));
    } catch (error) {
      this.logger.error(
        `Could not record who created fields in workspace ${payload.workspaceId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  @OnEvent('metadata.fieldMetadata.deleted')
  async handleFieldDeleted(payload: FieldMetadataEventBatch) {
    const fieldMetadataIds = getEventFields(payload, 'before').map(
      ({ id }) => id,
    );

    if (fieldMetadataIds.length === 0) {
      return;
    }

    try {
      await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
        await this.workspaceOrmManager
          .getRepository<PropertyGroupMembershipWorkspaceEntity>(
            'propertyGroupMembership',
            { shouldBypassPermissionChecks: true },
          )
          .delete({ fieldMetadataId: In(fieldMetadataIds) });
        await this.workspaceOrmManager
          .getRepository<PropertyCreationWorkspaceEntity>('propertyCreation', {
            shouldBypassPermissionChecks: true,
          })
          .delete({ fieldMetadataId: In(fieldMetadataIds) });
      }, buildSystemAuthContext(payload.workspaceId));
      this.propertyLogicConfigService.invalidate(payload.workspaceId);
    } catch (error) {
      this.logger.error(
        `Could not clean up deleted fields in workspace ${payload.workspaceId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async findMemberActor(userId: string): Promise<ActorMetadata | null> {
    const workspaceMember = await this.workspaceOrmManager
      .getRepository<WorkspaceMemberWorkspaceEntity>('workspaceMember', {
        shouldBypassPermissionChecks: true,
      })
      .findOne({ where: { userId } });

    if (!isDefined(workspaceMember)) {
      return null;
    }

    return {
      source: FieldActorSource.MANUAL,
      name: `${workspaceMember.name.firstName} ${workspaceMember.name.lastName}`.trim(),
      workspaceMemberId: workspaceMember.id,
      context: {},
    };
  }
}
