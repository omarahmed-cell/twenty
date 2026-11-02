import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { In, IsNull, MoreThan, Not } from 'typeorm';

import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { type ResolvedFieldSyncConfig } from 'src/modules/field-sync/types/resolved-field-sync-config.type';
import { formatSyncedValue } from 'src/modules/field-sync/utils/format-synced-value.util';
import { resolveFieldSyncConfigs } from 'src/modules/field-sync/utils/resolve-field-sync-configs.util';

const BATCH_SIZE = 500;

type SyncRecord = Record<string, unknown> & { id: string };

@Injectable()
export class FieldSyncService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  async getConfigs(workspaceId: string): Promise<ResolvedFieldSyncConfig[]> {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
      ]);

    return resolveFieldSyncConfigs(
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
    );
  }

  async syncTargetRecords({
    workspaceId,
    targetFieldId,
    targetRecordIds,
  }: {
    workspaceId: string;
    targetFieldId: string;
    targetRecordIds: string[];
  }): Promise<void> {
    await this.runForConfig(workspaceId, targetFieldId, async (config) => {
      for (let index = 0; index < targetRecordIds.length; index += BATCH_SIZE) {
        await this.syncTargetBatch(
          config,
          targetRecordIds.slice(index, index + BATCH_SIZE),
        );
      }
    });
  }

  async syncTargetRecordsBySources({
    workspaceId,
    targetFieldId,
    sourceRecordIds,
  }: {
    workspaceId: string;
    targetFieldId: string;
    sourceRecordIds: string[];
  }): Promise<void> {
    await this.runForConfig(workspaceId, targetFieldId, async (config) => {
      const targets = await this.getTargetRepository(config).find({
        where: { [config.joinColumnName]: In(sourceRecordIds) },
      });

      const targetIds = targets.map(({ id }) => id);

      for (let index = 0; index < targetIds.length; index += BATCH_SIZE) {
        await this.syncTargetBatch(
          config,
          targetIds.slice(index, index + BATCH_SIZE),
        );
      }
    });
  }

  // Destroying a source clears the join column in the database without emitting target events.
  async clearOrphanedTargets({
    workspaceId,
    targetFieldId,
  }: {
    workspaceId: string;
    targetFieldId: string;
  }): Promise<void> {
    await this.runForConfig(workspaceId, targetFieldId, async (config) => {
      await this.getTargetRepository(config).update(
        {
          [config.joinColumnName]: IsNull(),
          [config.targetFieldName]: Not(IsNull()),
        },
        { [config.targetFieldName]: null },
      );
    });
  }

  async backfill({
    workspaceId,
    targetFieldId,
  }: {
    workspaceId: string;
    targetFieldId: string;
  }): Promise<void> {
    await this.runForConfig(workspaceId, targetFieldId, async (config) => {
      const targetRepository = this.getTargetRepository(config);

      let lastId: string | undefined;

      for (;;) {
        const targets = await targetRepository.find({
          where: isDefined(lastId) ? { id: MoreThan(lastId) } : {},
          order: { id: 'ASC' },
          take: BATCH_SIZE,
        });

        if (targets.length === 0) {
          return;
        }

        await this.syncTargetBatch(
          config,
          targets.map(({ id }) => id),
        );

        lastId = targets[targets.length - 1].id;
      }
    });
  }

  private async runForConfig(
    workspaceId: string,
    targetFieldId: string,
    callback: (config: ResolvedFieldSyncConfig) => Promise<void>,
  ): Promise<void> {
    const config = (await this.getConfigs(workspaceId)).find(
      (resolvedConfig) => resolvedConfig.targetFieldId === targetFieldId,
    );

    if (!isDefined(config)) {
      return;
    }

    await this.workspaceOrmManager.executeInWorkspaceContext(
      () => callback(config),
      buildSystemAuthContext(workspaceId),
    );
  }

  private getTargetRepository(config: ResolvedFieldSyncConfig) {
    return this.workspaceOrmManager.getRepository<SyncRecord>(
      config.targetObjectNameSingular,
      { shouldBypassPermissionChecks: true },
    );
  }

  private async syncTargetBatch(
    config: ResolvedFieldSyncConfig,
    targetRecordIds: string[],
  ): Promise<void> {
    if (targetRecordIds.length === 0) {
      return;
    }

    const targetRepository = this.getTargetRepository(config);

    const targets = await targetRepository.find({
      where: { id: In(targetRecordIds) },
    });

    const sourceIds = [
      ...new Set(
        targets
          .map((target) => target[config.joinColumnName])
          .filter(isNonEmptyString),
      ),
    ];

    const sources =
      sourceIds.length === 0
        ? []
        : await this.workspaceOrmManager
            .getRepository<SyncRecord>(config.sourceObjectNameSingular, {
              shouldBypassPermissionChecks: true,
            })
            .find({ where: { id: In(sourceIds) } });

    const sourceById = new Map(sources.map((source) => [source.id, source]));

    const recordIdsByValue = new Map<
      string,
      { value: unknown; recordIds: string[] }
    >();

    for (const target of targets) {
      const sourceId = target[config.joinColumnName];

      const source = isNonEmptyString(sourceId)
        ? sourceById.get(sourceId)
        : undefined;

      const value = formatSyncedValue({
        sourceFieldType: config.sourceFieldType,
        value: source?.[config.sourceFieldName],
      });

      const valueKey = JSON.stringify(value);

      // The ORM reads empty text and multi-select as '' and [], while the formatter's empty is null.
      const currentValue = formatSyncedValue({
        sourceFieldType: config.sourceFieldType,
        value: target[config.targetFieldName],
      });

      if (JSON.stringify(currentValue) === valueKey) {
        continue;
      }

      const group = recordIdsByValue.get(valueKey) ?? { value, recordIds: [] };

      group.recordIds.push(target.id);
      recordIdsByValue.set(valueKey, group);
    }

    for (const { value, recordIds } of recordIdsByValue.values()) {
      await targetRepository.update(
        { id: In(recordIds) },
        { [config.targetFieldName]: value },
      );
    }
  }
}
