import { Injectable, Logger } from '@nestjs/common';

import {
  buildFormulaVariables,
  coerceFormulaResult,
  evaluateFormula,
  isDefined,
  isFormulaValueUnchanged,
} from 'twenty-shared/utils';
import { In, MoreThan } from 'typeorm';

import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { type ResolvedFieldFormulaConfig } from 'src/modules/field-formula/types/resolved-field-formula-config.type';
import { resolveFieldFormulaConfigs } from 'src/modules/field-formula/utils/resolve-field-formula-configs.util';

const BATCH_SIZE = 500;

type FormulaRecord = Record<string, unknown> & { id: string };

@Injectable()
export class FieldFormulaService {
  private readonly logger = new Logger(FieldFormulaService.name);

  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  async getConfigs(workspaceId: string): Promise<ResolvedFieldFormulaConfig[]> {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
      ]);

    return resolveFieldFormulaConfigs(
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
    );
  }

  async recomputeRecords({
    workspaceId,
    objectNameSingular,
    recordIds,
  }: {
    workspaceId: string;
    objectNameSingular: string;
    recordIds: string[];
  }): Promise<void> {
    await this.runForObject(
      workspaceId,
      objectNameSingular,
      async (configs) => {
        for (let index = 0; index < recordIds.length; index += BATCH_SIZE) {
          await this.recomputeBatch(
            configs,
            objectNameSingular,
            recordIds.slice(index, index + BATCH_SIZE),
          );
        }
      },
    );
  }

  async backfill({
    workspaceId,
    targetFieldId,
  }: {
    workspaceId: string;
    targetFieldId: string;
  }): Promise<void> {
    // Backfills follow metadata changes, which this process's 10s cache memoizer may not have seen yet.
    await this.workspaceCacheService.evictWorkspaceFromLocalCache(workspaceId);

    const objectNameSingular = (await this.getConfigs(workspaceId)).find(
      (config) => config.targetFieldId === targetFieldId,
    )?.objectNameSingular;

    if (!isDefined(objectNameSingular)) {
      return;
    }

    await this.runForObject(
      workspaceId,
      objectNameSingular,
      async (configs) => {
        const repository = this.getRepository(objectNameSingular);

        let lastId: string | undefined;

        for (;;) {
          const records = await repository.find({
            where: isDefined(lastId) ? { id: MoreThan(lastId) } : {},
            order: { id: 'ASC' },
            take: BATCH_SIZE,
          });

          if (records.length === 0) {
            return;
          }

          await this.writeChanges(configs, objectNameSingular, records);

          lastId = records[records.length - 1].id;
        }
      },
    );
  }

  private async runForObject(
    workspaceId: string,
    objectNameSingular: string,
    callback: (configs: ResolvedFieldFormulaConfig[]) => Promise<void>,
  ): Promise<void> {
    const configs = (await this.getConfigs(workspaceId)).filter(
      (config) => config.objectNameSingular === objectNameSingular,
    );

    if (configs.length === 0) {
      return;
    }

    await this.workspaceOrmManager.executeInWorkspaceContext(
      () => callback(configs),
      buildSystemAuthContext(workspaceId),
    );
  }

  private getRepository(objectNameSingular: string) {
    return this.workspaceOrmManager.getRepository<FormulaRecord>(
      objectNameSingular,
      { shouldBypassPermissionChecks: true },
    );
  }

  private async recomputeBatch(
    configs: ResolvedFieldFormulaConfig[],
    objectNameSingular: string,
    recordIds: string[],
  ): Promise<void> {
    const records = await this.getRepository(objectNameSingular).find({
      where: { id: In(recordIds) },
    });

    await this.writeChanges(configs, objectNameSingular, records);
  }

  private computeValue(
    config: ResolvedFieldFormulaConfig,
    record: FormulaRecord,
  ) {
    const evaluation = evaluateFormula(
      config.expression,
      buildFormulaVariables(record, config.dependencies),
    );

    const result =
      evaluation.status === 'success'
        ? coerceFormulaResult(evaluation.value, config.outputType)
        : evaluation;

    if (result.status === 'success') {
      return result.value;
    }

    this.logger.warn(
      `Formula field ${config.targetFieldName} on record ${record.id}: ${result.error}`,
    );

    return null;
  }

  private async writeChanges(
    configs: ResolvedFieldFormulaConfig[],
    objectNameSingular: string,
    records: FormulaRecord[],
  ): Promise<void> {
    const recordIdsByPatch = new Map<
      string,
      { patch: Record<string, unknown>; recordIds: string[] }
    >();

    for (const record of records) {
      const patch: Record<string, unknown> = {};

      for (const config of configs) {
        const value = this.computeValue(config, record);

        if (
          !isFormulaValueUnchanged(
            record[config.targetFieldName],
            value,
            config.outputType,
          )
        ) {
          patch[config.targetFieldName] = value;
        }
      }

      if (Object.keys(patch).length === 0) {
        continue;
      }

      const patchKey = JSON.stringify(patch);
      const group = recordIdsByPatch.get(patchKey) ?? { patch, recordIds: [] };

      group.recordIds.push(record.id);
      recordIdsByPatch.set(patchKey, group);
    }

    const repository = this.getRepository(objectNameSingular);

    for (const { patch, recordIds } of recordIdsByPatch.values()) {
      await repository.update({ id: In(recordIds) }, patch);
    }
  }
}
