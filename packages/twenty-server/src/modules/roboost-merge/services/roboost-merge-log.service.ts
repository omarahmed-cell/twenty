import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import {
  ROBOOST_UNMERGE_WINDOW_DAYS,
  type RoboostMergeObjectName,
} from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { RoboostMergeAfterEffectsService } from 'src/modules/roboost-merge/services/roboost-merge-after-effects.service';
import { RoboostMergeService } from 'src/modules/roboost-merge/services/roboost-merge.service';
import {
  type RoboostMergeActor,
  type RoboostMergeFieldChange,
  type RoboostMergeLogRow,
  type RoboostMergeMovedLink,
} from 'src/modules/roboost-merge/types/roboost-merge.type';

type RawRow = Record<string, unknown>;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const sameValue = (first: unknown, second: unknown) =>
  JSON.stringify(first ?? null) === JSON.stringify(second ?? null);

const toIso = (value: unknown) =>
  isDefined(value) ? new Date(value as string).toISOString() : null;

const quote = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;

export type RoboostUnmergeFieldConflict = {
  fieldName: string;
  fieldLabel: string;
  currentValue: unknown;
  preMergeValue: unknown;
};

@Injectable()
export class RoboostMergeLogService {
  private readonly logger = new Logger(RoboostMergeLogService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly roboostMergeService: RoboostMergeService,
    private readonly roboostMergeAfterEffectsService: RoboostMergeAfterEffectsService,
  ) {}

  private schema(workspaceId: string) {
    return quote(getWorkspaceSchemaName(workspaceId));
  }

  async tableExists(workspaceId: string) {
    const [{ exists }]: { exists: string | null }[] =
      await this.coreDataSource.query(`SELECT to_regclass($1)::text AS exists`, [
        `${this.schema(workspaceId)}."roboostMergeLog"`,
      ]);

    return isDefined(exists);
  }

  toLog(row: RawRow): RoboostMergeLogRow {
    return {
      id: row.id as string,
      objectName: row.objectName as string,
      primaryId: row.primaryId as string,
      secondaryId: row.secondaryId as string,
      primaryName: (row.primaryName as string) ?? null,
      secondaryName: (row.secondaryName as string) ?? null,
      mergedById: (row.mergedById as string) ?? null,
      mergedByName: (row.mergedByName as string) ?? null,
      mergedAt: toIso(row.mergedAt) as string,
      isBulk: row.isBulk === true,
      status: row.status as RoboostMergeLogRow['status'],
      secondarySnapshot: (row.secondarySnapshot as RawRow) ?? null,
      primaryBefore: (row.primaryBefore as RawRow) ?? null,
      primaryChanges: (row.primaryChanges as RoboostMergeFieldChange[]) ?? [],
      movedLinks: (row.movedLinks as RoboostMergeMovedLink[]) ?? [],
      segmentMembershipsAdded: (row.segmentMembershipsAdded as string[]) ?? [],
      unmergedAt: toIso(row.unmergedAt),
      unmergedByName: (row.unmergedByName as string) ?? null,
      expiredAt: toIso(row.expiredAt),
    };
  }

  async findLog(workspaceId: string, mergeId: string) {
    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostMergeLog" WHERE id = $1`,
      [mergeId],
    );

    if (rows.length === 0) {
      throw new BadRequestException('Merge not found');
    }

    return this.toLog(rows[0]);
  }

  isUnmergeable(log: RoboostMergeLogRow) {
    return (
      log.status === 'MERGED' &&
      Date.now() - new Date(log.mergedAt).getTime() <
        ROBOOST_UNMERGE_WINDOW_DAYS * DAY_IN_MS
    );
  }

  // The merges a record took part in, newest first, in the shape the Merge history panel shows
  async history(workspaceId: string, objectName: string, recordId: string) {
    if (!(await this.tableExists(workspaceId))) {
      return [];
    }

    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostMergeLog"
      WHERE "objectName" = $1 AND ("primaryId" = $2 OR "secondaryId" = $2)
      ORDER BY "mergedAt" DESC LIMIT 200`,
      [objectName, recordId],
    );

    return rows.map((row) => {
      const log = this.toLog(row);

      return {
        id: log.id,
        primaryId: log.primaryId,
        secondaryId: log.secondaryId,
        primaryName: log.primaryName,
        secondaryName: log.secondaryName,
        mergedByName: log.mergedByName,
        mergedAt: log.mergedAt,
        isBulk: log.isBulk,
        status: log.status,
        unmergedAt: log.unmergedAt,
        unmergedByName: log.unmergedByName,
        isUnmergeable: this.isUnmergeable(log),
        changes: log.primaryChanges.map((change) => change.fieldLabel),
        movedLinkCount: log.movedLinks.reduce(
          (total, link) => total + link.movedIds.length,
          0,
        ),
        segmentCount: log.segmentMembershipsAdded.length,
      };
    });
  }

  // Fields the merge changed on the primary that someone edited after the merge
  async unmergePreview(workspaceId: string, mergeId: string) {
    const log = await this.findLog(workspaceId, mergeId);
    const objectName = this.roboostMergeService.assertMergeObject(
      log.objectName,
    );
    const context = await this.roboostMergeService.getObjectContext(
      workspaceId,
      objectName,
    );
    const primaryRow = await this.roboostMergeService.loadRow(
      context,
      log.primaryId,
    );
    const conflicts: RoboostUnmergeFieldConflict[] = isDefined(primaryRow)
      ? log.primaryChanges
          .filter((change) => change.fieldName !== 'mergedRecordIds')
          .filter((change) =>
            Object.entries(change.columns).some(
              ([column, value]) => !sameValue(primaryRow[column], value.after),
            ),
          )
          .map((change) => ({
            fieldName: change.fieldName,
            fieldLabel: change.fieldLabel,
            currentValue: Object.fromEntries(
              Object.keys(change.columns).map((column) => [
                column,
                primaryRow[column] ?? null,
              ]),
            ),
            preMergeValue: Object.fromEntries(
              Object.entries(change.columns).map(([column, value]) => [
                column,
                value.before,
              ]),
            ),
          }))
      : [];

    return {
      mergeId: log.id,
      isUnmergeable: this.isUnmergeable(log),
      primaryName: log.primaryName,
      secondaryName: log.secondaryName,
      restoredFieldLabels: log.primaryChanges
        .filter((change) => change.fieldName !== 'mergedRecordIds')
        .map((change) => change.fieldLabel),
      movedLinkCount: log.movedLinks.reduce(
        (total, link) => total + link.movedIds.length,
        0,
      ),
      segmentCount: log.segmentMembershipsAdded.length,
      conflicts,
    };
  }

  async unmerge({
    workspaceId,
    actor,
    isAdmin,
    mergeId,
    keepCurrentFieldNames,
  }: {
    workspaceId: string;
    actor: RoboostMergeActor;
    isAdmin: boolean;
    mergeId: string;
    keepCurrentFieldNames: string[];
  }) {
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can unmerge');
    }

    const log = await this.findLog(workspaceId, mergeId);

    if (!this.isUnmergeable(log)) {
      throw new BadRequestException(
        `This merge can no longer be undone (it is ${log.status.toLowerCase()} or older than ${ROBOOST_UNMERGE_WINDOW_DAYS} days)`,
      );
    }

    const objectName = this.roboostMergeService.assertMergeObject(
      log.objectName,
    ) as RoboostMergeObjectName;
    const context = await this.roboostMergeService.getObjectContext(
      workspaceId,
      objectName,
    );
    const keepCurrent = new Set(keepCurrentFieldNames);
    const now = new Date().toISOString();
    const secondaryRow = log.secondarySnapshot ?? {};

    const movedBack = await this.coreDataSource.transaction(async (manager) => {
      const [primaryRow]: RawRow[] = await manager.query(
        `SELECT * FROM ${this.roboostMergeService.table(context)} WHERE id = $1 FOR UPDATE`,
        [log.primaryId],
      );

      if (!isDefined(primaryRow)) {
        throw new BadRequestException('The surviving record no longer exists');
      }

      // Values first: restoring the secondary must not clash with a value that moved to the primary
      const assignments: Record<string, unknown> = {};

      for (const change of log.primaryChanges) {
        const isUnchangedSinceMerge = Object.entries(change.columns).every(
          ([column, value]) => sameValue(primaryRow[column], value.after),
        );

        if (change.fieldName === 'mergedRecordIds') {
          const removed = new Set(
            [
              log.secondaryId,
              ...(Array.isArray(secondaryRow.mergedRecordIds)
                ? (secondaryRow.mergedRecordIds as string[])
                : []),
            ].map(String),
          );
          const current = Array.isArray(primaryRow.mergedRecordIds)
            ? (primaryRow.mergedRecordIds as string[])
            : [];
          const kept = current.filter((id) => !removed.has(String(id)));

          assignments.mergedRecordIds = kept.length > 0 ? kept : null;
          continue;
        }

        if (isUnchangedSinceMerge || !keepCurrent.has(change.fieldName)) {
          for (const [column, value] of Object.entries(change.columns)) {
            assignments[column] = value.before;
          }
          continue;
        }

        // Kept current emails or domains still lose the secondary's own values
        if (change.fieldName === 'emails') {
          const secondaryEmails = new Set(
            [
              secondaryRow.emailsPrimaryEmail,
              ...(Array.isArray(secondaryRow.emailsAdditionalEmails)
                ? (secondaryRow.emailsAdditionalEmails as unknown[])
                : []),
            ]
              .filter((email): email is string => typeof email === 'string')
              .map((email) => email.toLowerCase()),
          );
          const kept = (
            Array.isArray(primaryRow.emailsAdditionalEmails)
              ? (primaryRow.emailsAdditionalEmails as string[])
              : []
          ).filter((email) => !secondaryEmails.has(String(email).toLowerCase()));

          assignments.emailsAdditionalEmails = kept.length > 0 ? kept : null;
        }

        if (change.fieldName === 'domainName') {
          const secondaryDomains = new Set(
            [
              { url: secondaryRow.domainNamePrimaryLinkUrl },
              ...(Array.isArray(secondaryRow.domainNameSecondaryLinks)
                ? (secondaryRow.domainNameSecondaryLinks as { url?: unknown }[])
                : []),
            ].map((link) => String(link?.url ?? '').toLowerCase()),
          );
          const kept = (
            Array.isArray(primaryRow.domainNameSecondaryLinks)
              ? (primaryRow.domainNameSecondaryLinks as { url?: unknown }[])
              : []
          ).filter(
            (link) => !secondaryDomains.has(String(link?.url ?? '').toLowerCase()),
          );

          assignments.domainNameSecondaryLinks = kept.length > 0 ? kept : null;
        }
      }

      const columns = Object.keys(assignments);

      if (columns.length > 0) {
        await manager.query(
          `UPDATE ${this.roboostMergeService.table(context)} SET ${columns
            .map((column, index) => `${quote(column)} = $${index + 2}`)
            .join(', ')}, "updatedAt" = now() WHERE id = $1`,
          [
            log.primaryId,
            ...columns.map((column) =>
              this.roboostMergeService.toSqlValue(assignments[column]),
            ),
          ],
        );
      }

      await manager.query(
        `UPDATE ${this.roboostMergeService.table(context)} SET "deletedAt" = NULL WHERE id = $1`,
        [log.secondaryId],
      );

      // Only the links that came from the secondary go back; anything added later stays
      const moved: RoboostMergeMovedLink[] = [];

      for (const link of log.movedLinks) {
        const table = `${quote(context.schemaName)}.${quote(link.tableName)}`;
        const backIds: { id: string }[] =
          link.movedIds.length > 0
            ? await manager.query(
                `UPDATE ${table} SET ${quote(link.columnName)} = $2 WHERE id = ANY($1::uuid[]) AND ${quote(link.columnName)} = $3 RETURNING id`,
                [link.movedIds, log.secondaryId, log.primaryId],
              )
            : [];

        if (link.softDeletedIds.length > 0) {
          await manager.query(
            `UPDATE ${table} SET "deletedAt" = NULL WHERE id = ANY($1::uuid[])`,
            [link.softDeletedIds],
          );
        }

        moved.push({
          ...link,
          movedIds: backIds.map((row) => row.id),
        });
      }

      const secondaryName = log.secondaryName ?? log.secondaryId;
      const primaryName = log.primaryName ?? log.primaryId;

      await this.roboostMergeService.writeHistory({
        manager,
        context,
        recordId: log.primaryId,
        mergeId: log.id,
        actor,
        changes: [],
        event: {
          kind: 'unmerged',
          otherRecordId: log.secondaryId,
          otherRecordName: secondaryName,
        },
        now,
      });
      await this.roboostMergeService.writeHistory({
        manager,
        context,
        recordId: log.secondaryId,
        mergeId: log.id,
        actor,
        changes: [],
        event: {
          kind: 'unmergedFrom',
          otherRecordId: log.primaryId,
          otherRecordName: primaryName,
        },
        now,
      });

      await manager.query(
        `UPDATE ${this.schema(workspaceId)}."roboostMergeLog"
        SET status = 'UNMERGED', "unmergedAt" = $2, "unmergedById" = $3, "unmergedByName" = $4
        WHERE id = $1`,
        [log.id, now, actor.workspaceMemberId, actor.name],
      );

      return moved;
    });

    await this.roboostMergeAfterEffectsService.afterRecordsChanged({
      workspaceId,
      objectName,
      recordIds: [log.primaryId, log.secondaryId],
      movedLinks: movedBack,
      relatedCompanyIds: [secondaryRow.companyId]
        .filter((id): id is string => typeof id === 'string'),
    });

    this.logger.log(
      `Workspace ${workspaceId}: merge ${log.id} undone (${objectName} ${log.secondaryId} restored)`,
    );

    return true;
  }

  // After the unmerge window the merged record is deleted for good and the snapshot shrinks to its name
  async expireOldMerges(workspaceId: string): Promise<number> {
    if (!(await this.tableExists(workspaceId))) {
      return 0;
    }

    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostMergeLog"
      WHERE status = 'MERGED' AND "mergedAt" < now() - ($1 || ' days')::interval`,
      [String(ROBOOST_UNMERGE_WINDOW_DAYS)],
    );
    let expiredCount = 0;

    for (const row of rows) {
      const log = this.toLog(row);

      try {
        const context = await this.roboostMergeService.getObjectContext(
          workspaceId,
          this.roboostMergeService.assertMergeObject(log.objectName),
        );

        await this.coreDataSource.transaction(async (manager) => {
          await manager.query(
            `DELETE FROM ${this.roboostMergeService.table(context)} WHERE id = $1 AND "deletedAt" IS NOT NULL`,
            [log.secondaryId],
          );
          await manager.query(
            `UPDATE ${this.schema(workspaceId)}."roboostMergeLog"
            SET status = 'EXPIRED', "expiredAt" = now(),
              "secondarySnapshot" = jsonb_build_object('id', "secondaryId", 'name', "secondaryName"),
              "primaryBefore" = NULL
            WHERE id = $1`,
            [log.id],
          );
        });
        expiredCount++;
      } catch (error) {
        this.logger.error(
          `Workspace ${workspaceId}: could not expire merge ${log.id}: ${(error as Error).message}`,
        );
      }
    }

    return expiredCount;
  }

  // All merges for the CSV export, newest first
  async listAll(workspaceId: string) {
    if (!(await this.tableExists(workspaceId))) {
      return [];
    }

    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT id, "objectName", "primaryId", "secondaryId", "primaryName", "secondaryName", "mergedByName", "mergedAt", "isBulk", status, "unmergedAt", "unmergedByName"
      FROM ${this.schema(workspaceId)}."roboostMergeLog" ORDER BY "mergedAt" DESC`,
    );

    return rows.map((row) => ({
      id: row.id as string,
      objectName: row.objectName as string,
      primaryId: row.primaryId as string,
      secondaryId: row.secondaryId as string,
      primaryName: (row.primaryName as string) ?? '',
      secondaryName: (row.secondaryName as string) ?? '',
      mergedByName: (row.mergedByName as string) ?? '',
      mergedAt: toIso(row.mergedAt) as string,
      isBulk: row.isBulk === true,
      status: row.status as string,
      unmergedAt: toIso(row.unmergedAt),
      unmergedByName: (row.unmergedByName as string) ?? '',
    }));
  }
}
