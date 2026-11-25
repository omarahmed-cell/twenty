import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { ROBOOST_MERGE_OBJECT_NAMES } from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';
import { DataSource, In, LessThan, Not } from 'typeorm';

import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { TRASH_CLEANUP_BATCH_SIZE } from 'src/engine/trash-cleanup/constants/trash-cleanup-batch-size.constant';
import { TRASH_CLEANUP_MAX_RECORDS_PER_WORKSPACE } from 'src/engine/trash-cleanup/constants/trash-cleanup-max-records-per-workspace.constant';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

export type TrashCleanupInput = {
  workspaceId: string;
  trashRetentionDays: number;
};

@Injectable()
export class TrashCleanupService {
  private readonly logger = new Logger(TrashCleanupService.name);
  private readonly maxRecordsPerWorkspace =
    TRASH_CLEANUP_MAX_RECORDS_PER_WORKSPACE;
  private readonly batchSize = TRASH_CLEANUP_BATCH_SIZE;

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
  ) {}

  async cleanupWorkspaceTrash(input: TrashCleanupInput): Promise<number> {
    const { workspaceId, trashRetentionDays } = input;

    const { flatObjectMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps'],
        },
      );

    const objectNames = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier ?? {},
    )
      .map((metadata) => metadata?.nameSingular)
      .filter(isDefined);

    if (objectNames.length === 0) {
      this.logger.log(`No objects found in workspace ${workspaceId}`);

      return 0;
    }

    const cutoffDate = this.calculateCutoffDate(trashRetentionDays);
    let deletedCount = 0;

    for (const objectName of objectNames) {
      if (deletedCount >= this.maxRecordsPerWorkspace) {
        this.logger.log(
          `Reached deletion limit (${this.maxRecordsPerWorkspace}) for workspace ${workspaceId}`,
        );
        break;
      }

      const remainingQuota = this.maxRecordsPerWorkspace - deletedCount;
      const deletedForObject = await this.deleteSoftDeletedRecords({
        workspaceId,
        objectName,
        cutoffDate,
        remainingQuota,
      });

      if (deletedForObject > 0) {
        this.logger.log(
          `Deleted ${deletedForObject} record(s) from ${objectName} in workspace ${workspaceId}`,
        );
      }

      deletedCount += deletedForObject;
    }

    this.logger.log(
      `Deleted ${deletedCount} record(s) from workspace ${workspaceId}`,
    );

    return deletedCount;
  }

  private async deleteSoftDeletedRecords({
    workspaceId,
    objectName,
    cutoffDate,
    remainingQuota,
  }: {
    workspaceId: string;
    objectName: string;
    cutoffDate: Date;
    remainingQuota: number;
  }): Promise<number> {
    if (remainingQuota <= 0) {
      return 0;
    }

    const authContext = buildSystemAuthContext(workspaceId);
    const mergeProtectedIds = await this.findMergeProtectedIds(
      workspaceId,
      objectName,
    );

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository = this.workspaceOrmManager.getRepository(objectName, {
        shouldBypassPermissionChecks: true,
      });

      let deleted = 0;

      while (deleted < remainingQuota) {
        const take = Math.min(this.batchSize, remainingQuota - deleted);

        const recordsToDelete = await repository.find({
          withDeleted: true,
          select: ['id'],
          where: {
            deletedAt: LessThan(cutoffDate),
            ...(mergeProtectedIds.length > 0
              ? { id: Not(In(mergeProtectedIds)) }
              : {}),
          },
          order: { deletedAt: 'ASC' },
          take,
        });

        if (recordsToDelete.length === 0) {
          break;
        }

        await repository.delete({
          id: In(recordsToDelete.map((record) => record.id)),
        });

        deleted += recordsToDelete.length;
      }

      return deleted;
    }, authContext);
  }

  // Merged records stay in the trash for the 30-day unmerge window; the merge expiry cron deletes them
  private async findMergeProtectedIds(
    workspaceId: string,
    objectName: string,
  ): Promise<string[]> {
    if (
      !(ROBOOST_MERGE_OBJECT_NAMES as readonly string[]).includes(objectName)
    ) {
      return [];
    }

    const table = `"${getWorkspaceSchemaName(workspaceId)}"."roboostMergeLog"`;
    const [{ exists }]: { exists: string | null }[] =
      await this.coreDataSource.query(
        `SELECT to_regclass($1)::text AS exists`,
        [table],
      );

    if (!isDefined(exists)) {
      return [];
    }

    const rows: { secondaryId: string }[] = await this.coreDataSource.query(
      `SELECT "secondaryId" FROM ${table} WHERE "objectName" = $1 AND status = 'MERGED'`,
      [objectName],
    );

    return rows.map((row) => row.secondaryId);
  }

  private calculateCutoffDate(trashRetentionDays: number): Date {
    const cutoffDate = new Date();

    cutoffDate.setUTCHours(0, 0, 0, 0);
    cutoffDate.setDate(cutoffDate.getDate() - trashRetentionDays + 1);

    return cutoffDate;
  }
}
