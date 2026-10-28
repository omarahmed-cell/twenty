import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { CacheLockService } from 'src/engine/core-modules/cache-lock/cache-lock.service';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import {
  SEGMENT_TARGET_OBJECT_CONFIGS,
  SEGMENT_TARGET_OBJECTS,
} from 'src/modules/segment/constants/segment-target-object-configs.constant';
import { type SegmentWorkspaceEntity } from 'src/modules/segment/standard-objects/segment.workspace-entity';
import { areSegmentMembershipOptionsEqual } from 'src/modules/segment/utils/are-segment-membership-options-equal.util';
import { buildSegmentMembershipOptions } from 'src/modules/segment/utils/build-segment-membership-options.util';

@Injectable()
export class SegmentMembershipOptionsService {
  private readonly logger = new Logger(SegmentMembershipOptionsService.name);

  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly applicationService: ApplicationService,
    private readonly cacheLockService: CacheLockService,
  ) {}

  // Rebuilds each Segment Membership field's options from the live segments, so create,
  // rename, retarget, delete and restore all converge on the same state
  async syncOptions(workspaceId: string): Promise<void> {
    await this.cacheLockService.withLock(
      () => this.syncOptionsWithoutLock(workspaceId),
      `segment-membership-options:${workspaceId}`,
      { ttl: 60_000, maxRetries: 600 },
    );
  }

  async hasOption({
    workspaceId,
    fieldUniversalIdentifier,
    optionValue,
  }: {
    workspaceId: string;
    fieldUniversalIdentifier: string;
    optionValue: string;
  }): Promise<boolean> {
    const { flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatFieldMetadataMaps',
      ]);

    const flatFieldMetadata =
      flatFieldMetadataMaps.byUniversalIdentifier[fieldUniversalIdentifier];

    return (flatFieldMetadata?.options ?? []).some(
      (option) => option.value === optionValue,
    );
  }

  private async syncOptionsWithoutLock(workspaceId: string): Promise<void> {
    const segments = await this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.workspaceOrmManager
          .getRepository<SegmentWorkspaceEntity>('segment', {
            shouldBypassPermissionChecks: true,
          })
          .find({
            select: { id: true, name: true, targetObject: true },
            order: { createdAt: 'ASC' },
          }),
      buildSystemAuthContext(workspaceId),
    );

    const { flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatFieldMetadataMaps',
      ]);

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    for (const targetObject of SEGMENT_TARGET_OBJECTS) {
      const { segmentMembershipFieldUniversalIdentifier } =
        SEGMENT_TARGET_OBJECT_CONFIGS[targetObject];

      const flatFieldMetadata =
        flatFieldMetadataMaps.byUniversalIdentifier[
          segmentMembershipFieldUniversalIdentifier
        ];

      if (!isDefined(flatFieldMetadata)) {
        this.logger.warn(
          `Workspace ${workspaceId} has no Segment Membership field for ${targetObject}`,
        );
        continue;
      }

      const desiredOptions = buildSegmentMembershipOptions(
        segments.filter((segment) => segment.targetObject === targetObject),
      );

      if (
        areSegmentMembershipOptionsEqual(
          flatFieldMetadata.options ?? [],
          desiredOptions,
        )
      ) {
        continue;
      }

      await this.fieldMetadataService.updateOneField({
        workspaceId,
        isSystemBuild: true,
        ownerFlatApplication: twentyStandardFlatApplication,
        updateFieldInput: {
          id: flatFieldMetadata.id,
          options: desiredOptions,
        },
      });
    }
  }
}
