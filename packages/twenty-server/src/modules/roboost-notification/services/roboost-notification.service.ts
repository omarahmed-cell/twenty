import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { RoboostLoadModeService } from 'src/engine/core-modules/roboost-load-mode/roboost-load-mode.service';
import { UserVarsService } from 'src/engine/core-modules/user/user-vars/services/user-vars.service';
import { RoboostRecordVisibilityService } from 'src/engine/metadata-modules/role/services/roboost-record-visibility.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import {
  type RoboostNotificationInput,
  type RoboostNotificationRelatedRecord,
  type RoboostNotificationRow,
  type RoboostNotificationTab,
  type RoboostNotificationType,
} from 'src/modules/roboost-notification/types/roboost-notification.type';

export const ROBOOST_NOTIFICATION_TYPES_USER_VAR = 'roboost.notificationTypes';

const TABLE = 'roboostNotification';
const PAGE_SIZE_MAX = 100;
const TRASH_RETENTION_DAYS = 30;
const READ_RETENTION_DAYS = 90;
const RETENTION_BATCH = 1000;

const ROW_COLUMNS = `id, type, subtype, title, body, "actorName", "targetObjectNameSingular",
  "targetRecordId", "targetPath", "downloadUrl", "actionLabel", "relatedRecords", "relatedCount",
  "isRead", "readAt", "isTrashed", "trashedAt", "createdAt"`;

type Scope = {
  workspaceId: string;
  workspaceMemberId: string;
};

// Bulk actions take ids, or "everything in this tab and type" for Select all
export type RoboostNotificationSelection = {
  ids?: string[] | null;
  allInTab?: RoboostNotificationTab | null;
  type?: RoboostNotificationType | null;
};

const tabCondition = (tab: RoboostNotificationTab) =>
  tab === 'TRASH'
    ? `"isTrashed" = true`
    : tab === 'UNREAD'
      ? `"isTrashed" = false AND "isRead" = false`
      : `"isTrashed" = false`;

@Injectable()
export class RoboostNotificationService {
  private readonly logger = new Logger(RoboostNotificationService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly userVarsService: UserVarsService,
    private readonly roboostRecordVisibilityService: RoboostRecordVisibilityService,
    private readonly roboostLoadModeService: RoboostLoadModeService,
  ) {}

  private table(workspaceId: string) {
    return `"${getWorkspaceSchemaName(workspaceId)}"."${TABLE}"`;
  }

  // Bell notifications for a type can be switched off per user in Settings → Notifications
  private async isTypeEnabled({
    workspaceId,
    workspaceMemberId,
    type,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
    type: RoboostNotificationType;
  }): Promise<boolean> {
    const [member]: { userId: string | null }[] =
      await this.coreDataSource.query(
        `SELECT "userId" FROM "${getWorkspaceSchemaName(workspaceId)}"."workspaceMember" WHERE id = $1 AND "deletedAt" IS NULL`,
        [workspaceMemberId],
      );

    if (!isDefined(member)) {
      return false;
    }
    if (!isDefined(member.userId)) {
      return true;
    }

    const preferences = (await this.userVarsService.get({
      userId: member.userId,
      workspaceId,
      key: ROBOOST_NOTIFICATION_TYPES_USER_VAR,
    })) as Partial<Record<RoboostNotificationType, boolean>> | undefined;

    return preferences?.[type] !== false;
  }

  async notify(input: RoboostNotificationInput): Promise<string | null> {
    try {
      if (await this.roboostLoadModeService.isOn(input.workspaceId)) {
        return null;
      }

      if (
        !(await this.isTypeEnabled({
          workspaceId: input.workspaceId,
          workspaceMemberId: input.recipientWorkspaceMemberId,
          type: input.type,
        }))
      ) {
        return null;
      }

      // A notification never points at a record its recipient can't open
      if (
        isDefined(input.target.objectNameSingular) &&
        isDefined(input.target.recordId) &&
        !(await this.roboostRecordVisibilityService.canViewRecord({
          workspaceId: input.workspaceId,
          workspaceMemberId: input.recipientWorkspaceMemberId,
          objectNameSingular: input.target.objectNameSingular,
          recordId: input.target.recordId,
        }))
      ) {
        return null;
      }

      const values = [
        input.recipientWorkspaceMemberId,
        input.type,
        input.subtype,
        input.title,
        input.body,
        input.actorWorkspaceMemberId ?? null,
        input.actorName ?? null,
        input.target.objectNameSingular ?? null,
        input.target.recordId ?? null,
        input.target.path ?? null,
        input.target.downloadUrl ?? null,
        input.target.actionLabel ?? null,
        JSON.stringify(input.relatedRecords ?? []),
        input.relatedCount ?? input.relatedRecords?.length ?? 0,
        input.groupKey ?? null,
        input.groupWindowSeconds ?? null,
      ];

      if (isDefined(input.groupKey)) {
        const updated: { id: string }[] = await this.coreDataSource.query(
          `WITH updated AS (UPDATE ${this.table(input.workspaceId)}
          SET title = $4, body = $5, "actorWorkspaceMemberId" = $6, "actorName" = $7,
            "targetObjectNameSingular" = $8, "targetRecordId" = $9, "targetPath" = $10,
            "downloadUrl" = $11, "actionLabel" = $12, "relatedRecords" = $13::jsonb,
            "relatedCount" = $14, subtype = $3, "createdAt" = now()
          WHERE "recipientWorkspaceMemberId" = $1 AND type = $2 AND "groupKey" = $15
            AND "isRead" = false AND "isTrashed" = false
            AND ($16::int IS NULL OR "createdAt" > now() - make_interval(secs => $16::int))
          RETURNING id) SELECT id FROM updated`,
          values,
        );

        if (updated.length > 0) {
          return updated[0].id;
        }
      }

      const [inserted]: { id: string }[] = await this.coreDataSource.query(
        `INSERT INTO ${this.table(input.workspaceId)}
          ("recipientWorkspaceMemberId", type, subtype, title, body, "actorWorkspaceMemberId", "actorName",
           "targetObjectNameSingular", "targetRecordId", "targetPath", "downloadUrl", "actionLabel",
           "relatedRecords", "relatedCount", "groupKey")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15)
        RETURNING id`,
        values.slice(0, 15),
      );

      return inserted?.id ?? null;
    } catch (error) {
      // A notification must never fail the change that triggered it
      this.logger.error(
        `Could not create a ${input.subtype} notification in workspace ${input.workspaceId}: ${error}`,
      );

      return null;
    }
  }

  async existsWithGroupKey({
    workspaceId,
    recipientWorkspaceMemberId,
    groupKey,
  }: {
    workspaceId: string;
    recipientWorkspaceMemberId: string;
    groupKey: string;
  }): Promise<boolean> {
    const [row]: { exists: boolean }[] = await this.coreDataSource.query(
      `SELECT EXISTS (SELECT 1 FROM ${this.table(workspaceId)}
        WHERE "recipientWorkspaceMemberId" = $1 AND "groupKey" = $2) AS exists`,
      [recipientWorkspaceMemberId, groupKey],
    );

    return row?.exists === true;
  }

  // The unread notification a new event would merge into, when one exists inside the window
  async findRecentGroup({
    workspaceId,
    recipientWorkspaceMemberId,
    groupKey,
    windowSeconds,
  }: {
    workspaceId: string;
    recipientWorkspaceMemberId: string;
    groupKey: string;
    windowSeconds: number;
  }): Promise<{
    relatedRecords: RoboostNotificationRelatedRecord[];
    relatedCount: number;
  } | null> {
    const [row]: {
      relatedRecords: RoboostNotificationRelatedRecord[];
      relatedCount: number;
    }[] = await this.coreDataSource.query(
      `SELECT "relatedRecords", "relatedCount" FROM ${this.table(workspaceId)}
      WHERE "recipientWorkspaceMemberId" = $1 AND "groupKey" = $2
        AND "isRead" = false AND "isTrashed" = false
        AND "createdAt" > now() - make_interval(secs => $3::int)
      ORDER BY "createdAt" DESC LIMIT 1`,
      [recipientWorkspaceMemberId, groupKey, windowSeconds],
    );

    return row ?? null;
  }

  async list({
    workspaceId,
    workspaceMemberId,
    tab,
    type,
    before,
    limit,
  }: Scope & {
    tab: RoboostNotificationTab;
    type: RoboostNotificationType | null;
    before: string | null;
    limit: number;
  }): Promise<{ items: RoboostNotificationRow[]; hasMore: boolean }> {
    const pageSize = Math.min(Math.max(limit, 1), PAGE_SIZE_MAX);
    const [cursorCreatedAt, cursorId] = (before ?? '').split('|');
    const rows: RoboostNotificationRow[] = await this.coreDataSource.query(
      `SELECT ${ROW_COLUMNS} FROM ${this.table(workspaceId)}
      WHERE "recipientWorkspaceMemberId" = $1 AND ${tabCondition(tab)}
        AND ($2::text IS NULL OR type = $2)
        AND ($3::timestamptz IS NULL OR ("createdAt", id) < ($3::timestamptz, $4::uuid))
      ORDER BY "createdAt" DESC, id DESC
      LIMIT $5`,
      [
        workspaceMemberId,
        type,
        before === null || cursorCreatedAt === '' ? null : cursorCreatedAt,
        before === null || cursorId === undefined ? null : cursorId,
        pageSize + 1,
      ],
    );

    return {
      items: rows.slice(0, pageSize).map((row) => ({
        ...row,
        createdAt: new Date(row.createdAt).toISOString(),
        readAt: isDefined(row.readAt)
          ? new Date(row.readAt).toISOString()
          : null,
        trashedAt: isDefined(row.trashedAt)
          ? new Date(row.trashedAt).toISOString()
          : null,
      })),
      hasMore: rows.length > pageSize,
    };
  }

  async counts({ workspaceId, workspaceMemberId }: Scope) {
    const [row]: { unread: number; all: number; trash: number }[] =
      await this.coreDataSource.query(
        `SELECT
          count(*) FILTER (WHERE "isTrashed" = false AND "isRead" = false)::int AS unread,
          count(*) FILTER (WHERE "isTrashed" = false)::int AS "all",
          count(*) FILTER (WHERE "isTrashed" = true)::int AS trash
        FROM ${this.table(workspaceId)} WHERE "recipientWorkspaceMemberId" = $1`,
        [workspaceMemberId],
      );

    return row ?? { unread: 0, all: 0, trash: 0 };
  }

  // $1 is always the recipient; Select all filters by tab and type, otherwise by ids
  private buildSelection(
    workspaceMemberId: string,
    selection: RoboostNotificationSelection,
  ): { condition: string; parameters: unknown[] } {
    if (isDefined(selection.allInTab)) {
      return {
        condition: `${tabCondition(selection.allInTab)} AND ($2::text IS NULL OR type = $2)`,
        parameters: [workspaceMemberId, selection.type ?? null],
      };
    }

    return {
      condition: 'id = ANY($2::uuid[])',
      parameters: [workspaceMemberId, selection.ids ?? []],
    };
  }

  async update({
    workspaceId,
    workspaceMemberId,
    selection,
    action,
  }: Scope & {
    selection: RoboostNotificationSelection;
    action: 'READ' | 'UNREAD' | 'TRASH' | 'RESTORE' | 'DELETE';
  }): Promise<number> {
    const table = this.table(workspaceId);
    const { condition, parameters } = this.buildSelection(
      workspaceMemberId,
      selection,
    );
    const where = `"recipientWorkspaceMemberId" = $1 AND ${condition}`;
    const statement = {
      READ: `UPDATE ${table} SET "isRead" = true, "readAt" = now() WHERE ${where} AND "isRead" = false`,
      UNREAD: `UPDATE ${table} SET "isRead" = false, "readAt" = NULL WHERE ${where} AND "isRead" = true`,
      TRASH: `UPDATE ${table} SET "isTrashed" = true, "trashedAt" = now() WHERE ${where} AND "isTrashed" = false`,
      RESTORE: `UPDATE ${table} SET "isTrashed" = false, "trashedAt" = NULL WHERE ${where} AND "isTrashed" = true`,
      // Permanent delete only empties the trash, so a stray call can never lose live notifications
      DELETE: `DELETE FROM ${table} WHERE ${where} AND "isTrashed" = true`,
    }[action];
    const result = await this.coreDataSource.query(
      `WITH changed AS (${statement} RETURNING 1) SELECT count(*)::int AS count FROM changed`,
      parameters,
    );

    return result[0]?.count ?? 0;
  }

  // Trash older than 30 days and read notifications older than 90 days, in small batches
  async applyRetention(workspaceId: string): Promise<number> {
    const table = this.table(workspaceId);
    let removed = 0;

    for (;;) {
      const result = await this.coreDataSource.query(
        `WITH doomed AS (
          SELECT id FROM ${table}
          WHERE ("isTrashed" = true AND "trashedAt" < now() - interval '${TRASH_RETENTION_DAYS} days')
             OR ("isRead" = true AND "readAt" < now() - interval '${READ_RETENTION_DAYS} days')
          LIMIT ${RETENTION_BATCH}
        ), removed AS (DELETE FROM ${table} WHERE id IN (SELECT id FROM doomed) RETURNING 1)
        SELECT count(*)::int AS count FROM removed`,
      );
      const count = result[0]?.count ?? 0;

      removed += count;
      if (count < RETENTION_BATCH) {
        return removed;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  async tableExists(workspaceId: string): Promise<boolean> {
    const [row]: { exists: boolean }[] = await this.coreDataSource.query(
      `SELECT to_regclass($1) IS NOT NULL AS exists`,
      [`"${getWorkspaceSchemaName(workspaceId)}"."${TABLE}"`],
    );

    return row?.exists === true;
  }
}
