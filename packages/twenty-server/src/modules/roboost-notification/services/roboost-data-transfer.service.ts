import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

export const EXPORT_FILE_RETENTION_DAYS = 30;
const PAGE_SIZE_MAX = 100;
const IMPORT_RECORD_BATCH = 1000;
const EXPORT_SOURCES = ['View', 'Records', 'Report'];
export const IMPORT_STATES = [
  'IN_PROGRESS',
  'DONE',
  'DONE_WITH_ERRORS',
  'FAILED',
] as const;

export type RoboostImportState = (typeof IMPORT_STATES)[number];

export type RoboostExportRow = {
  id: string;
  name: string;
  source: string;
  objectNameSingular: string | null;
  recordCount: number;
  workspaceMemberId: string | null;
  userName: string | null;
  userEmail: string | null;
  fileName: string;
  isAvailable: boolean;
  createdAt: string;
};

export type RoboostImportRow = {
  id: string;
  name: string;
  objectNameSingular: string;
  state: RoboostImportState;
  newCount: number;
  updatedCount: number;
  newAssociations: number;
  errorCount: number;
  hasErrorFile: boolean;
  duplicateMatchCount?: number | null;
  workspaceMemberId: string | null;
  createdByName: string | null;
  createdAt: string;
  finishedAt: string | null;
};

type Scope = { workspaceId: string; workspaceMemberId: string };

const toIso = (value: unknown) =>
  isDefined(value) ? new Date(value as string).toISOString() : null;

@Injectable()
export class RoboostDataTransferService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  private schema(workspaceId: string) {
    return `"${getWorkspaceSchemaName(workspaceId)}"`;
  }

  async getMember(workspaceId: string, workspaceMemberId: string) {
    const [member]: {
      name: string;
      email: string | null;
    }[] = await this.coreDataSource.query(
      `SELECT trim(coalesce("nameFirstName", '') || ' ' || coalesce("nameLastName", '')) AS name,
        "userEmail" AS email
      FROM ${this.schema(workspaceId)}."workspaceMember" WHERE id = $1`,
      [workspaceMemberId],
    );

    return member ?? { name: '', email: null };
  }

  // Members holding the Admin role, active ones only
  async getAdminMemberIds(workspaceId: string): Promise<string[]> {
    const rows: { id: string }[] = await this.coreDataSource.query(
      `SELECT DISTINCT wm.id FROM ${this.schema(workspaceId)}."workspaceMember" wm
      JOIN core."userWorkspace" uw ON uw."userId" = wm."userId" AND uw."workspaceId" = $1
      JOIN core."roleTarget" rt ON rt."userWorkspaceId" = uw.id
      JOIN core."role" r ON r.id = rt."roleId"
      WHERE r.label = 'Admin' AND wm."deletedAt" IS NULL
        AND coalesce(wm."memberStatus"::text, 'ACTIVE') <> 'DEACTIVATED'`,
      [workspaceId],
    );

    return rows.map(({ id }) => id);
  }

  async isAdmin(workspaceId: string, workspaceMemberId: string) {
    return (await this.getAdminMemberIds(workspaceId)).includes(
      workspaceMemberId,
    );
  }

  async logExport({
    workspaceId,
    workspaceMemberId,
    name,
    source,
    objectNameSingular,
    recordCount,
    fileName,
    content,
  }: Scope & {
    name: string;
    source: string;
    objectNameSingular: string | null;
    recordCount: number;
    fileName: string;
    content: string;
  }): Promise<RoboostExportRow> {
    const member = await this.getMember(workspaceId, workspaceMemberId);
    const [row] = await this.coreDataSource.query(
      `INSERT INTO ${this.schema(workspaceId)}."roboostExport"
        (name, source, "objectNameSingular", "recordCount", "workspaceMemberId", "userName", "userEmail", "fileName", content)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, "createdAt"`,
      [
        name.slice(0, 200),
        EXPORT_SOURCES.includes(source) ? source : 'View',
        objectNameSingular,
        recordCount,
        workspaceMemberId,
        member.name,
        member.email,
        fileName.slice(0, 200),
        content,
      ],
    );

    return {
      id: row.id,
      name,
      source,
      objectNameSingular,
      recordCount,
      workspaceMemberId,
      userName: member.name,
      userEmail: member.email,
      fileName,
      isAvailable: true,
      createdAt: new Date(row.createdAt).toISOString(),
    };
  }

  async listExports({
    workspaceId,
    search,
    sortDirection,
    page,
    pageSize,
  }: {
    workspaceId: string;
    search: string | null;
    sortDirection: 'ASC' | 'DESC';
    page: number;
    pageSize: number;
  }): Promise<{ items: RoboostExportRow[]; total: number }> {
    const limit = Math.min(Math.max(pageSize, 1), PAGE_SIZE_MAX);
    const term = isNonEmptyString(search?.trim()) ? `%${search.trim()}%` : null;
    const rows = await this.coreDataSource.query(
      `SELECT id, name, source, "objectNameSingular", "recordCount", "workspaceMemberId",
        "userName", "userEmail", "fileName", (content IS NOT NULL) AS "isAvailable", "createdAt",
        count(*) OVER ()::int AS total
      FROM ${this.schema(workspaceId)}."roboostExport"
      WHERE ($1::text IS NULL OR name ILIKE $1 OR "userName" ILIKE $1 OR "userEmail" ILIKE $1)
      ORDER BY "createdAt" ${sortDirection === 'ASC' ? 'ASC' : 'DESC'}
      LIMIT $2 OFFSET $3`,
      [term, limit, Math.max(page - 1, 0) * limit],
    );

    return {
      items: rows.map((row: RoboostExportRow & { total: number }) => ({
        ...row,
        createdAt: toIso(row.createdAt) ?? '',
      })),
      total: rows[0]?.total ?? 0,
    };
  }

  // The exporter downloads their own files; admins can download any
  async getExportFile({
    workspaceId,
    workspaceMemberId,
    id,
  }: Scope & { id: string }) {
    const [row]: {
      fileName: string;
      content: string | null;
      workspaceMemberId: string | null;
    }[] = await this.coreDataSource.query(
      `SELECT "fileName", content, "workspaceMemberId" FROM ${this.schema(workspaceId)}."roboostExport" WHERE id = $1`,
      [id],
    );

    if (!isDefined(row)) {
      return null;
    }
    if (
      row.workspaceMemberId !== workspaceMemberId &&
      !(await this.isAdmin(workspaceId, workspaceMemberId))
    ) {
      throw new ForbiddenException(
        'Only the exporter or an admin can download this file',
      );
    }

    return { fileName: row.fileName, content: row.content };
  }

  async startImport({
    workspaceId,
    workspaceMemberId,
    name,
    objectNameSingular,
  }: Scope & { name: string; objectNameSingular: string }): Promise<string> {
    const member = await this.getMember(workspaceId, workspaceMemberId);
    const [row] = await this.coreDataSource.query(
      `INSERT INTO ${this.schema(workspaceId)}."roboostImport"
        (name, "objectNameSingular", "workspaceMemberId", "createdByName")
      VALUES ($1, $2, $3, $4) RETURNING id`,
      [name.slice(0, 200), objectNameSingular, workspaceMemberId, member.name],
    );

    return row.id;
  }

  async finishImport({
    workspaceId,
    workspaceMemberId,
    id,
    state,
    newCount,
    updatedCount,
    newAssociations,
    errorCount,
    errorFile,
    recordIds,
  }: Scope & {
    id: string;
    state: RoboostImportState;
    newCount: number;
    updatedCount: number;
    newAssociations: number;
    errorCount: number;
    errorFile: string | null;
    recordIds: string[];
  }): Promise<RoboostImportRow | null> {
    const schema = this.schema(workspaceId);
    const [row] = await this.coreDataSource.query(
      `WITH finished AS (UPDATE ${schema}."roboostImport"
      SET state = $3, "newCount" = $4, "updatedCount" = $5, "newAssociations" = $6,
        "errorCount" = $7, "errorFile" = $8, "finishedAt" = now()
      WHERE id = $1 AND "workspaceMemberId" = $2
      RETURNING "objectNameSingular") SELECT "objectNameSingular" FROM finished`,
      [
        id,
        workspaceMemberId,
        state,
        newCount,
        updatedCount,
        newAssociations,
        errorCount,
        errorFile,
      ],
    );

    if (!isDefined(row)) {
      return null;
    }

    for (
      let start = 0;
      start < recordIds.length;
      start += IMPORT_RECORD_BATCH
    ) {
      await this.coreDataSource.query(
        `INSERT INTO ${schema}."roboostImportRecord" ("importId", "recordId", "objectNameSingular")
        SELECT $1, unnest($2::uuid[]), $3
        ON CONFLICT DO NOTHING`,
        [
          id,
          recordIds.slice(start, start + IMPORT_RECORD_BATCH),
          row.objectNameSingular,
        ],
      );
    }

    return this.getImport(workspaceId, id);
  }

  async renameImport({
    workspaceId,
    id,
    name,
  }: {
    workspaceId: string;
    id: string;
    name: string;
  }) {
    await this.coreDataSource.query(
      `UPDATE ${this.schema(workspaceId)}."roboostImport" SET name = $2 WHERE id = $1`,
      [id, name.trim().slice(0, 200)],
    );

    return this.getImport(workspaceId, id);
  }

  async getImport(
    workspaceId: string,
    id: string,
  ): Promise<RoboostImportRow | null> {
    const { items } = await this.listImports({
      workspaceId,
      ids: [id],
      page: 1,
      pageSize: 1,
    });

    return items[0] ?? null;
  }

  async listImports({
    workspaceId,
    ids,
    search,
    objectNameSingular,
    state,
    createdById,
    createdFrom,
    createdTo,
    page,
    pageSize,
  }: {
    workspaceId: string;
    ids?: string[] | null;
    search?: string | null;
    objectNameSingular?: string | null;
    state?: string | null;
    createdById?: string | null;
    createdFrom?: string | null;
    createdTo?: string | null;
    page: number;
    pageSize: number;
  }): Promise<{ items: RoboostImportRow[]; total: number }> {
    const limit = Math.min(Math.max(pageSize, 1), PAGE_SIZE_MAX);
    const term = isNonEmptyString(search?.trim())
      ? `%${search?.trim()}%`
      : null;
    const rows = await this.coreDataSource.query(
      `SELECT id, name, "objectNameSingular", state, "newCount", "updatedCount", "newAssociations",
        "errorCount", ("errorFile" IS NOT NULL) AS "hasErrorFile", "workspaceMemberId",
        "createdByName", "createdAt", "finishedAt", count(*) OVER ()::int AS total,
        (to_jsonb(i) ->> 'duplicateMatchCount')::int AS "duplicateMatchCount"
      FROM ${this.schema(workspaceId)}."roboostImport" i
      WHERE ($1::uuid[] IS NULL OR id = ANY($1::uuid[]))
        AND ($2::text IS NULL OR name ILIKE $2)
        AND ($3::text IS NULL OR "objectNameSingular" = $3)
        AND ($4::text IS NULL OR state = $4)
        AND ($5::uuid IS NULL OR "workspaceMemberId" = $5)
        AND ($6::timestamptz IS NULL OR "createdAt" >= $6)
        AND ($7::timestamptz IS NULL OR "createdAt" < $7)
      ORDER BY "createdAt" DESC
      LIMIT $8 OFFSET $9`,
      [
        isDefined(ids) && ids.length > 0 ? ids : null,
        term,
        objectNameSingular ?? null,
        state ?? null,
        createdById ?? null,
        createdFrom ?? null,
        createdTo ?? null,
        limit,
        Math.max(page - 1, 0) * limit,
      ],
    );

    return {
      items: rows.map((row: RoboostImportRow & { total: number }) => ({
        ...row,
        createdAt: toIso(row.createdAt) ?? '',
        finishedAt: toIso(row.finishedAt),
      })),
      total: rows[0]?.total ?? 0,
    };
  }

  async getImportErrorFile(workspaceId: string, id: string) {
    const [row]: { name: string; errorFile: string | null }[] =
      await this.coreDataSource.query(
        `SELECT name, "errorFile" FROM ${this.schema(workspaceId)}."roboostImport" WHERE id = $1`,
        [id],
      );

    return isDefined(row?.errorFile)
      ? { fileName: `${row.name} - errors.csv`, content: row.errorFile }
      : null;
  }

  // For the "Import is any of / none of" filter: the imports that touched this object, newest first
  async listImportOptions(workspaceId: string, objectNameSingular: string) {
    const rows: { id: string; name: string; createdAt: string }[] =
      await this.coreDataSource.query(
        `SELECT DISTINCT i.id, i.name, i."createdAt"
        FROM ${this.schema(workspaceId)}."roboostImport" i
        JOIN ${this.schema(workspaceId)}."roboostImportRecord" r ON r."importId" = i.id
        WHERE r."objectNameSingular" = $1
        ORDER BY i."createdAt" DESC LIMIT 500`,
        [objectNameSingular],
      );

    return rows.map(({ id, name }) => ({ id, name }));
  }

  async listImportRecordIds({
    workspaceId,
    importIds,
    objectNameSingular,
  }: {
    workspaceId: string;
    importIds: string[];
    objectNameSingular: string;
  }): Promise<string[]> {
    const rows: { recordId: string }[] = await this.coreDataSource.query(
      `SELECT DISTINCT "recordId" FROM ${this.schema(workspaceId)}."roboostImportRecord"
      WHERE "importId" = ANY($1::uuid[]) AND "objectNameSingular" = $2`,
      [importIds, objectNameSingular],
    );

    return rows.map(({ recordId }) => recordId);
  }

  // Records created by an import: the CRM import that created it (its file name), else the name the HubSpot loader stored
  async getRecordImportSource({
    workspaceId,
    objectNameSingular,
    recordId,
  }: {
    workspaceId: string;
    objectNameSingular: string;
    recordId: string;
  }): Promise<{ isImport: boolean; importName: string | null }> {
    const schema = this.schema(workspaceId);
    const [table]: { exists: boolean }[] = await this.coreDataSource.query(
      `SELECT to_regclass($1) IS NOT NULL AS exists`,
      [`${schema}."${objectNameSingular}"`],
    );

    if (table?.exists !== true) {
      return { isImport: false, importName: null };
    }

    const [row]: { isImport: boolean; importName: string | null }[] =
      await this.coreDataSource.query(
        `SELECT r."createdBySource"::text = 'IMPORT' AS "isImport",
          coalesce(
            (SELECT i.name FROM ${schema}."roboostImportRecord" ir
              JOIN ${schema}."roboostImport" i ON i.id = ir."importId"
              WHERE ir."objectNameSingular" = $2 AND ir."recordId" = r.id
              ORDER BY i."createdAt" ASC LIMIT 1),
            nullif(r."createdByContext"->>'importName', '')
          ) AS "importName"
        FROM ${schema}."${objectNameSingular}" r
        WHERE r.id = $1`,
        [recordId, objectNameSingular],
      );

    return row?.isImport === true
      ? { isImport: true, importName: row.importName }
      : { isImport: false, importName: null };
  }

  // Files go after 30 days; the audit row stays and shows Expired
  async expireExportFiles(workspaceId: string): Promise<number> {
    const result = await this.coreDataSource.query(
      `WITH expired AS (
        UPDATE ${this.schema(workspaceId)}."roboostExport"
        SET content = NULL, "expiredAt" = now()
        WHERE content IS NOT NULL AND "createdAt" < now() - interval '${EXPORT_FILE_RETENTION_DAYS} days'
        RETURNING 1
      ) SELECT count(*)::int AS count FROM expired`,
    );

    return result[0]?.count ?? 0;
  }

  async tablesExist(workspaceId: string): Promise<boolean> {
    const [row]: { exists: boolean }[] = await this.coreDataSource.query(
      `SELECT to_regclass($1) IS NOT NULL AS exists`,
      [`${this.schema(workspaceId)}."roboostExport"`],
    );

    return row?.exists === true;
  }
}
