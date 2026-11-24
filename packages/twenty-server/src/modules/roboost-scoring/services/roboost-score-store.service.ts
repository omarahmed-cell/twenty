import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import {
  isDefined,
  parseRoboostScoreCriteria,
  type RoboostScoreBreakdown,
  type RoboostScoreCriteria,
  type RoboostScoreObjectName,
} from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import {
  type RoboostScoreActor,
  type RoboostScoreResultRow,
  type RoboostScoreResultSource,
  type RoboostScoreRow,
  type RoboostScoreVersionRow,
} from 'src/modules/roboost-scoring/types/roboost-score.type';

const toIso = (value: unknown) =>
  isDefined(value) ? new Date(value as string).toISOString() : null;

const toNumberOrNull = (value: unknown) =>
  isDefined(value) ? Number(value) : null;

type RawRow = Record<string, unknown>;

const SCORE_COLUMNS = `s.*, v.version AS "publishedVersionNumber"`;

const UPDATABLE_COLUMNS = [
  'name',
  'description',
  'isActive',
  'scoreMin',
  'scoreMax',
  'linkedFieldMetadataId',
  'freezeOnClosedWon',
  'publishedVersionId',
  'draft',
  'hasDraftChanges',
] as const;

export type RoboostScorePatch = Partial<
  Pick<RoboostScoreRow, (typeof UPDATABLE_COLUMNS)[number]>
>;

export type RoboostScoreResultWrite = {
  recordId: string;
  value: number | null;
  versionId: string | null;
  versionNumber: number | null;
  breakdown: RoboostScoreBreakdown | null;
  frozen: boolean;
  frozenAt: string | null;
  source: RoboostScoreResultSource;
};

@Injectable()
export class RoboostScoreStoreService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  schema(workspaceId: string) {
    return `"${getWorkspaceSchemaName(workspaceId)}"`;
  }

  async tablesExist(workspaceId: string): Promise<boolean> {
    const [row] = await this.coreDataSource.query(
      `SELECT to_regclass($1) IS NOT NULL AS "exists"`,
      [`${getWorkspaceSchemaName(workspaceId)}."roboostScoreResult"`],
    );

    return row?.exists === true;
  }

  async getMemberActor(
    workspaceId: string,
    workspaceMemberId: string,
  ): Promise<RoboostScoreActor> {
    const [row] = await this.coreDataSource.query(
      `SELECT trim(concat("nameFirstName", ' ', "nameLastName")) AS name
      FROM ${this.schema(workspaceId)}."workspaceMember" WHERE id = $1`,
      [workspaceMemberId],
    );

    return { workspaceMemberId, name: row?.name || 'Unknown' };
  }

  // Roles come later; for now scores are managed by workspace admins only
  async isAdmin(workspaceId: string, workspaceMemberId: string) {
    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT 1 FROM ${this.schema(workspaceId)}."workspaceMember" wm
      JOIN core."userWorkspace" uw ON uw."userId" = wm."userId" AND uw."workspaceId" = $1
      JOIN core."roleTarget" rt ON rt."userWorkspaceId" = uw.id
      JOIN core."role" r ON r.id = rt."roleId"
      WHERE wm.id = $2 AND r.label = 'Admin' AND wm."deletedAt" IS NULL
      LIMIT 1`,
      [workspaceId, workspaceMemberId],
    );

    return rows.length > 0;
  }

  private toScore(row: RawRow): RoboostScoreRow {
    return {
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string | null) ?? null,
      objectName: row.objectName as RoboostScoreObjectName,
      isActive: row.isActive === true,
      scoreMin: Number(row.scoreMin),
      scoreMax: Number(row.scoreMax),
      linkedFieldMetadataId: (row.linkedFieldMetadataId as string) ?? null,
      freezeOnClosedWon: row.freezeOnClosedWon === true,
      publishedVersionId: (row.publishedVersionId as string) ?? null,
      publishedVersionNumber: toNumberOrNull(row.publishedVersionNumber),
      draft: parseRoboostScoreCriteria(row.draft),
      hasDraftChanges: row.hasDraftChanges === true,
      recalcStatus:
        (row.recalcStatus as RoboostScoreRow['recalcStatus']) ?? null,
      recalcTotal: toNumberOrNull(row.recalcTotal),
      recalcDone: toNumberOrNull(row.recalcDone),
      recalcStartedAt: toIso(row.recalcStartedAt),
      recalcFinishedAt: toIso(row.recalcFinishedAt),
      lastFullRecalcAt: toIso(row.lastFullRecalcAt),
      lastVerifiedAt: toIso(row.lastVerifiedAt),
      lastDriftCount: toNumberOrNull(row.lastDriftCount),
      createdAt: toIso(row.createdAt) as string,
      createdById: (row.createdById as string) ?? null,
      createdByName: (row.createdByName as string) ?? null,
      updatedAt: toIso(row.updatedAt) as string,
      updatedById: (row.updatedById as string) ?? null,
      updatedByName: (row.updatedByName as string) ?? null,
    };
  }

  private toVersion(row: RawRow): RoboostScoreVersionRow {
    return {
      id: row.id as string,
      scoreId: row.scoreId as string,
      version: Number(row.version),
      criteria: parseRoboostScoreCriteria(row.criteria),
      publishedAt: toIso(row.publishedAt) as string,
      publishedById: (row.publishedById as string) ?? null,
      publishedByName: (row.publishedByName as string) ?? null,
      note: (row.note as string) ?? null,
    };
  }

  private toResult(row: RawRow): RoboostScoreResultRow {
    return {
      scoreId: row.scoreId as string,
      recordId: row.recordId as string,
      value: toNumberOrNull(row.value),
      versionId: (row.versionId as string) ?? null,
      versionNumber: toNumberOrNull(row.versionNumber),
      breakdown: (row.breakdown as RoboostScoreBreakdown | null) ?? null,
      computedAt: toIso(row.computedAt) as string,
      frozen: row.frozen === true,
      frozenAt: toIso(row.frozenAt),
      source: (row.source as RoboostScoreResultSource) ?? 'SCORE',
    };
  }

  async listScores(workspaceId: string): Promise<RoboostScoreRow[]> {
    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT ${SCORE_COLUMNS} FROM ${this.schema(workspaceId)}."roboostScore" s
      LEFT JOIN ${this.schema(workspaceId)}."roboostScoreVersion" v ON v.id = s."publishedVersionId"
      ORDER BY s."updatedAt" DESC`,
    );

    return rows.map((row) => this.toScore(row));
  }

  async getScore(
    workspaceId: string,
    scoreId: string,
  ): Promise<RoboostScoreRow | null> {
    const [row] = await this.coreDataSource.query(
      `SELECT ${SCORE_COLUMNS} FROM ${this.schema(workspaceId)}."roboostScore" s
      LEFT JOIN ${this.schema(workspaceId)}."roboostScoreVersion" v ON v.id = s."publishedVersionId"
      WHERE s.id = $1`,
      [scoreId],
    );

    return isDefined(row) ? this.toScore(row) : null;
  }

  async findScoreByLinkedField(
    workspaceId: string,
    fieldMetadataId: string,
  ): Promise<RoboostScoreRow | null> {
    const [row] = await this.coreDataSource.query(
      `SELECT ${SCORE_COLUMNS} FROM ${this.schema(workspaceId)}."roboostScore" s
      LEFT JOIN ${this.schema(workspaceId)}."roboostScoreVersion" v ON v.id = s."publishedVersionId"
      WHERE s."linkedFieldMetadataId" = $1`,
      [fieldMetadataId],
    );

    return isDefined(row) ? this.toScore(row) : null;
  }

  // Active and published: the scores that keep their property up to date
  async findLiveScores(
    workspaceId: string,
    objectName?: string,
  ): Promise<{ score: RoboostScoreRow; version: RoboostScoreVersionRow }[]> {
    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT ${SCORE_COLUMNS}, row_to_json(v.*) AS "versionRow"
      FROM ${this.schema(workspaceId)}."roboostScore" s
      JOIN ${this.schema(workspaceId)}."roboostScoreVersion" v ON v.id = s."publishedVersionId"
      WHERE s."isActive" AND s."linkedFieldMetadataId" IS NOT NULL
        AND ($1::text IS NULL OR s."objectName" = $1)`,
      [objectName ?? null],
    );

    return rows.map((row) => ({
      score: this.toScore(row),
      version: this.toVersion(row.versionRow as RawRow),
    }));
  }

  async isLinkedFieldTaken(
    workspaceId: string,
    fieldMetadataId: string,
    exceptScoreId?: string,
  ) {
    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT 1 FROM ${this.schema(workspaceId)}."roboostScore"
      WHERE "linkedFieldMetadataId" = $1 AND ($2::uuid IS NULL OR id <> $2) LIMIT 1`,
      [fieldMetadataId, exceptScoreId ?? null],
    );

    return rows.length > 0;
  }

  async listLinkedFieldIds(workspaceId: string): Promise<string[]> {
    const rows: { id: string }[] = await this.coreDataSource.query(
      `SELECT "linkedFieldMetadataId" AS id FROM ${this.schema(workspaceId)}."roboostScore"
      WHERE "linkedFieldMetadataId" IS NOT NULL`,
    );

    return rows.map(({ id }) => id);
  }

  async createScore({
    workspaceId,
    name,
    objectName,
    linkedFieldMetadataId,
    draft,
    actor,
  }: {
    workspaceId: string;
    name: string;
    objectName: RoboostScoreObjectName;
    linkedFieldMetadataId: string | null;
    draft: RoboostScoreCriteria;
    actor: RoboostScoreActor;
  }): Promise<RoboostScoreRow> {
    const [row] = await this.coreDataSource.query(
      `INSERT INTO ${this.schema(workspaceId)}."roboostScore"
        (name, "objectName", "linkedFieldMetadataId", draft, "scoreMin", "scoreMax",
         "freezeOnClosedWon", "createdById", "createdByName", "updatedById", "updatedByName")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $8, $9)
      RETURNING id`,
      [
        name,
        objectName,
        linkedFieldMetadataId,
        JSON.stringify(draft),
        draft.scoreMin,
        draft.scoreMax,
        objectName === 'opportunity',
        actor.workspaceMemberId,
        actor.name,
      ],
    );

    return (await this.getScore(workspaceId, row.id)) as RoboostScoreRow;
  }

  async updateScore(
    workspaceId: string,
    scoreId: string,
    patch: RoboostScorePatch,
    actor?: RoboostScoreActor,
  ): Promise<void> {
    const assignments: string[] = [];
    const params: unknown[] = [scoreId];

    for (const column of UPDATABLE_COLUMNS) {
      if (patch[column] === undefined) {
        continue;
      }
      const value = patch[column];

      params.push(column === 'draft' ? JSON.stringify(value) : value);
      assignments.push(`"${column}" = $${params.length}`);
    }
    if (isDefined(actor)) {
      params.push(actor.workspaceMemberId, actor.name);
      assignments.push(
        `"updatedAt" = now()`,
        `"updatedById" = $${params.length - 1}`,
        `"updatedByName" = $${params.length}`,
      );
    }
    if (assignments.length === 0) {
      return;
    }

    await this.coreDataSource.query(
      `UPDATE ${this.schema(workspaceId)}."roboostScore" SET ${assignments.join(', ')} WHERE id = $1`,
      params,
    );
  }

  async deleteScore(workspaceId: string, scoreId: string) {
    await this.coreDataSource.query(
      `DELETE FROM ${this.schema(workspaceId)}."roboostScore" WHERE id = $1`,
      [scoreId],
    );
  }

  async publishVersion({
    workspaceId,
    scoreId,
    criteria,
    note,
    actor,
  }: {
    workspaceId: string;
    scoreId: string;
    criteria: RoboostScoreCriteria;
    note: string | null;
    actor: RoboostScoreActor;
  }): Promise<RoboostScoreVersionRow> {
    const schema = this.schema(workspaceId);
    const [row] = await this.coreDataSource.query(
      `INSERT INTO ${schema}."roboostScoreVersion"
        ("scoreId", version, criteria, "publishedById", "publishedByName", note)
      SELECT $1, coalesce(max(version), 0) + 1, $2, $3, $4, $5
      FROM ${schema}."roboostScoreVersion" WHERE "scoreId" = $1
      RETURNING *`,
      [
        scoreId,
        JSON.stringify(criteria),
        actor.workspaceMemberId,
        actor.name,
        note,
      ],
    );

    await this.updateScore(
      workspaceId,
      scoreId,
      {
        publishedVersionId: row.id,
        draft: criteria,
        hasDraftChanges: false,
        isActive: true,
        scoreMin: criteria.scoreMin,
        scoreMax: criteria.scoreMax,
      },
      actor,
    );

    return this.toVersion(row);
  }

  async listVersions(
    workspaceId: string,
    scoreId: string,
  ): Promise<RoboostScoreVersionRow[]> {
    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostScoreVersion"
      WHERE "scoreId" = $1 ORDER BY version DESC`,
      [scoreId],
    );

    return rows.map((row) => this.toVersion(row));
  }

  async getVersion(
    workspaceId: string,
    versionId: string,
  ): Promise<RoboostScoreVersionRow | null> {
    const [row] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostScoreVersion" WHERE id = $1`,
      [versionId],
    );

    return isDefined(row) ? this.toVersion(row) : null;
  }

  async setRecalcProgress(
    workspaceId: string,
    scoreId: string,
    progress:
      | { status: 'RUNNING'; total: number }
      | { status: 'PROGRESS'; done: number }
      | { status: 'DONE' | 'FAILED'; isFullRecalc: boolean },
  ) {
    const table = `${this.schema(workspaceId)}."roboostScore"`;

    switch (progress.status) {
      case 'RUNNING':
        await this.coreDataSource.query(
          `UPDATE ${table} SET "recalcStatus" = 'RUNNING', "recalcTotal" = $2, "recalcDone" = 0,
            "recalcStartedAt" = now(), "recalcFinishedAt" = NULL WHERE id = $1`,
          [scoreId, progress.total],
        );
        break;
      case 'PROGRESS':
        await this.coreDataSource.query(
          `UPDATE ${table} SET "recalcDone" = $2 WHERE id = $1`,
          [scoreId, progress.done],
        );
        break;
      default:
        await this.coreDataSource.query(
          `UPDATE ${table} SET "recalcStatus" = $2, "recalcFinishedAt" = now()
            ${progress.isFullRecalc && progress.status === 'DONE' ? `, "lastFullRecalcAt" = now()` : ''}
          WHERE id = $1`,
          [scoreId, progress.status],
        );
    }
  }

  async setVerification(
    workspaceId: string,
    scoreId: string,
    driftCount: number,
  ) {
    await this.coreDataSource.query(
      `UPDATE ${this.schema(workspaceId)}."roboostScore"
      SET "lastVerifiedAt" = now(), "lastDriftCount" = $2 WHERE id = $1`,
      [scoreId, driftCount],
    );
  }

  async getResults(
    workspaceId: string,
    scoreId: string,
    recordIds: string[],
  ): Promise<Map<string, RoboostScoreResultRow>> {
    const rows: RawRow[] =
      recordIds.length === 0
        ? []
        : await this.coreDataSource.query(
            `SELECT * FROM ${this.schema(workspaceId)}."roboostScoreResult"
            WHERE "scoreId" = $1 AND "recordId" = ANY($2::uuid[])`,
            [scoreId, recordIds],
          );

    return new Map(
      rows.map((row) => [row.recordId as string, this.toResult(row)]),
    );
  }

  async getRecordResults(
    workspaceId: string,
    recordId: string,
  ): Promise<RoboostScoreResultRow[]> {
    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostScoreResult" WHERE "recordId" = $1`,
      [recordId],
    );

    return rows.map((row) => this.toResult(row));
  }

  async upsertResults(
    workspaceId: string,
    scoreId: string,
    results: RoboostScoreResultWrite[],
  ) {
    if (results.length === 0) {
      return;
    }

    await this.coreDataSource.query(
      `INSERT INTO ${this.schema(workspaceId)}."roboostScoreResult"
        ("scoreId", "recordId", value, "versionId", "versionNumber", breakdown, frozen, "frozenAt", source, "computedAt")
      SELECT $1, r."recordId", r.value, r."versionId", r."versionNumber", r.breakdown, r.frozen, r."frozenAt", r.source, now()
      FROM jsonb_to_recordset($2::jsonb) AS r(
        "recordId" uuid, value double precision, "versionId" uuid, "versionNumber" integer,
        breakdown jsonb, frozen boolean, "frozenAt" timestamptz, source text)
      ON CONFLICT ("scoreId", "recordId") DO UPDATE SET
        value = excluded.value, "versionId" = excluded."versionId",
        "versionNumber" = excluded."versionNumber", breakdown = excluded.breakdown,
        frozen = excluded.frozen, "frozenAt" = excluded."frozenAt",
        source = excluded.source, "computedAt" = now()`,
      [scoreId, JSON.stringify(results)],
    );
  }

  // Results of records that were destroyed have nothing left to explain
  async deleteOrphanResults(
    workspaceId: string,
    scoreId: string,
    objectName: string,
  ): Promise<number> {
    const schema = this.schema(workspaceId);
    const [row] = await this.coreDataSource.query(
      `WITH removed AS (
        DELETE FROM ${schema}."roboostScoreResult" r
        WHERE r."scoreId" = $1
          AND NOT EXISTS (SELECT 1 FROM ${schema}."${objectName}" o WHERE o.id = r."recordId")
        RETURNING 1
      ) SELECT count(*)::int AS count FROM removed`,
      [scoreId],
    );

    return row?.count ?? 0;
  }
}
