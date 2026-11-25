import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import {
  ROBOOST_DUPLICATE_CONFIDENCE_RANK,
  ROBOOST_DUPLICATE_RULES,
  ROBOOST_MERGE_OBJECT_NAMES,
  type RoboostDuplicateConfidence,
  type RoboostDuplicatePairStatus,
  type RoboostDuplicateRuleKey,
  type RoboostMergeObjectName,
} from 'twenty-shared/constants';
import { type RoboostRecordScope } from 'twenty-shared/types';
import { isDefined, isNonEmptyArray } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';
import { v4 } from 'uuid';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { RoboostRecordVisibilityService } from 'src/engine/metadata-modules/role/services/roboost-record-visibility.service';
import { type RoboostMergeActor } from 'src/modules/roboost-merge/types/roboost-merge.type';
import {
  RoboostMergeService,
  type RoboostMergeObjectContext,
} from 'src/modules/roboost-merge/services/roboost-merge.service';
import { buildRoboostDuplicateCandidateQueries } from 'src/modules/roboost-merge/utils/build-roboost-duplicate-candidate-queries.util';

type RawRow = Record<string, unknown>;

export type RoboostDuplicateRecordSummary = {
  id: string;
  name: string;
  keyText: string;
  createdAt: string | null;
  filledCount: number;
};

export type RoboostDuplicatePairItem = {
  id: string;
  confidence: RoboostDuplicateConfidence;
  reasons: RoboostDuplicateRuleKey[];
  status: RoboostDuplicatePairStatus;
  detectedAt: string;
  resolvedAt: string | null;
  resolvedByName: string | null;
  recordA: RoboostDuplicateRecordSummary;
  recordB: RoboostDuplicateRecordSummary;
};

export type RoboostBulkMergePair = {
  pairId: string;
  primaryId: string;
  secondaryId: string;
  primaryName: string;
  secondaryName: string;
};

export type RoboostBulkMergeResult = {
  pairId: string;
  primaryId: string;
  secondaryId: string;
  status: 'MERGED' | 'SKIPPED' | 'FAILED';
  mergeId: string | null;
  message: string | null;
};

const quote = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;

const toIso = (value: unknown) =>
  value instanceof Date ? value.toISOString() : ((value as string) ?? null);

const parseJson = <TValue>(value: unknown, fallback: TValue): TValue => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as TValue;
    } catch {
      return fallback;
    }
  }

  return (value as TValue) ?? fallback;
};

@Injectable()
export class RoboostDuplicateService {
  private readonly logger = new Logger(RoboostDuplicateService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly roboostMergeService: RoboostMergeService,
    private readonly roboostRecordVisibilityService: RoboostRecordVisibilityService,
  ) {}

  private schema(workspaceId: string) {
    return quote(getWorkspaceSchemaName(workspaceId));
  }

  async tablesExist(workspaceId: string) {
    const [{ exists }]: { exists: string | null }[] =
      await this.coreDataSource.query(
        `SELECT to_regclass($1)::text AS exists`,
        [`${this.schema(workspaceId)}."roboostDuplicatePair"`],
      );

    return isDefined(exists);
  }

  private async assertTables(workspaceId: string) {
    if (!(await this.tablesExist(workspaceId))) {
      throw new BadRequestException(
        'Duplicate management is not set up yet for this workspace',
      );
    }
  }

  async getMergeScope(
    workspaceId: string,
    workspaceMemberId: string | null,
    objectName: RoboostMergeObjectName,
  ): Promise<RoboostRecordScope> {
    if (
      !isDefined(workspaceMemberId) ||
      (await this.roboostMergeService.isAdmin(workspaceId, workspaceMemberId))
    ) {
      return 'ALL';
    }

    const subject =
      await this.roboostRecordVisibilityService.getSubjectForMember(
        workspaceId,
        workspaceMemberId,
      );
    const objectPermissions = subject?.permissions.objects[objectName];

    if (!isDefined(subject) || !isDefined(objectPermissions)) {
      return 'ALL';
    }

    if (!objectPermissions.enabled || !isDefined(objectPermissions.merge)) {
      return 'NONE';
    }

    return objectPermissions.merge.scope;
  }

  private async assertCanManage(
    workspaceId: string,
    actor: RoboostMergeActor,
    objectName: RoboostMergeObjectName,
  ) {
    const scope = await this.getMergeScope(
      workspaceId,
      actor.workspaceMemberId,
      objectName,
    );

    if (scope === 'NONE') {
      throw new ForbiddenException(
        'Manage duplicates needs the Merge permission on this object',
      );
    }

    return scope;
  }

  async getRuleSettings(
    workspaceId: string,
    objectName: RoboostMergeObjectName,
  ) {
    const rows: RawRow[] = (await this.tablesExist(workspaceId))
      ? await this.coreDataSource.query(
          `SELECT * FROM ${this.schema(workspaceId)}."roboostDuplicateSettings" WHERE "objectName" = $1`,
          [objectName],
        )
      : [];
    const saved = parseJson<Partial<Record<RoboostDuplicateRuleKey, boolean>>>(
      rows[0]?.rules,
      {},
    );

    return {
      rules: ROBOOST_DUPLICATE_RULES.filter(
        (rule) => rule.objectName === objectName,
      ).map((rule) => ({
        key: rule.key,
        label: rule.label,
        confidence: rule.confidence,
        isEnabled: saved[rule.key] ?? rule.defaultEnabled,
      })),
      lastScanAt: toIso(rows[0]?.lastScanAt),
      lastScanPairCount: (rows[0]?.lastScanPairCount as number | null) ?? null,
    };
  }

  async saveRuleSettings({
    workspaceId,
    actor,
    objectName: rawObjectName,
    rules,
  }: {
    workspaceId: string;
    actor: RoboostMergeActor;
    objectName: string;
    rules: Record<string, boolean>;
  }) {
    const objectName =
      this.roboostMergeService.assertMergeObject(rawObjectName);

    if (
      !(await this.roboostMergeService.isAdmin(
        workspaceId,
        actor.workspaceMemberId,
      ))
    ) {
      throw new ForbiddenException('Only admins can change duplicate rules');
    }

    await this.assertTables(workspaceId);

    const allowedKeys = new Set(
      ROBOOST_DUPLICATE_RULES.filter(
        (rule) => rule.objectName === objectName,
      ).map((rule) => rule.key as string),
    );
    const cleaned = Object.fromEntries(
      Object.entries(rules).filter(
        ([key, value]) => allowedKeys.has(key) && typeof value === 'boolean',
      ),
    );

    await this.coreDataSource.query(
      `INSERT INTO ${this.schema(workspaceId)}."roboostDuplicateSettings" ("objectName", rules)
      VALUES ($1, $2::jsonb)
      ON CONFLICT ("objectName") DO UPDATE SET rules = EXCLUDED.rules`,
      [objectName, JSON.stringify(cleaned)],
    );

    return this.getRuleSettings(workspaceId, objectName);
  }

  private async tableColumns(context: RoboostMergeObjectContext) {
    const rows: { column_name: string }[] = await this.coreDataSource.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
      [context.schemaName, context.tableName],
    );

    return new Set(rows.map((row) => row.column_name));
  }

  private async findCandidates(
    workspaceId: string,
    objectName: RoboostMergeObjectName,
  ) {
    const context = await this.roboostMergeService.getObjectContext(
      workspaceId,
      objectName,
    );
    const settings = await this.getRuleSettings(workspaceId, objectName);
    const queries = buildRoboostDuplicateCandidateQueries({
      objectName,
      table: this.roboostMergeService.table(context),
      columns: await this.tableColumns(context),
      enabledRuleKeys: new Set(
        settings.rules.filter((rule) => rule.isEnabled).map((rule) => rule.key),
      ),
    });
    const pairs = new Map<
      string,
      {
        recordAId: string;
        recordBId: string;
        confidence: RoboostDuplicateConfidence;
        reasons: RoboostDuplicateRuleKey[];
      }
    >();

    for (const query of queries) {
      const confidence = ROBOOST_DUPLICATE_RULES.find(
        (rule) => rule.key === query.ruleKey,
      )?.confidence;

      if (!isDefined(confidence)) {
        continue;
      }

      const rows: { a: string; b: string }[] = await this.coreDataSource.query(
        query.sql,
      );

      for (const { a, b } of rows) {
        const key = `${a}:${b}`;
        const existing = pairs.get(key);

        if (!isDefined(existing)) {
          pairs.set(key, {
            recordAId: a,
            recordBId: b,
            confidence,
            reasons: [query.ruleKey],
          });
          continue;
        }

        existing.reasons.push(query.ruleKey);

        if (
          ROBOOST_DUPLICATE_CONFIDENCE_RANK[confidence] >
          ROBOOST_DUPLICATE_CONFIDENCE_RANK[existing.confidence]
        ) {
          existing.confidence = confidence;
        }
      }
    }

    return [...pairs.values()];
  }

  // A full scan refreshes open pairs and drops the ones that no longer match; rejected pairs stay rejected
  async scan({
    workspaceId,
    objectName,
    onlyRecordIds,
  }: {
    workspaceId: string;
    objectName: RoboostMergeObjectName;
    onlyRecordIds?: string[];
  }): Promise<number> {
    await this.assertTables(workspaceId);

    const scanStartedAt = new Date();
    const onlyIds = isDefined(onlyRecordIds) ? new Set(onlyRecordIds) : null;
    const candidates = (
      await this.findCandidates(workspaceId, objectName)
    ).filter(
      (pair) =>
        !isDefined(onlyIds) ||
        onlyIds.has(pair.recordAId) ||
        onlyIds.has(pair.recordBId),
    );
    const schema = this.schema(workspaceId);

    for (let start = 0; start < candidates.length; start += 500) {
      const chunk = candidates.slice(start, start + 500);

      await this.coreDataSource.query(
        `INSERT INTO ${schema}."roboostDuplicatePair" (id, "objectName", "recordAId", "recordBId", confidence, reasons, "lastSeenAt")
        SELECT id, $1::text, a, b, c, r::jsonb, $7::timestamptz FROM unnest($2::uuid[], $3::uuid[], $4::uuid[], $5::text[], $6::text[]) AS u(id, a, b, c, r)
        ON CONFLICT ("objectName", "recordAId", "recordBId") DO UPDATE
          SET confidence = EXCLUDED.confidence, reasons = EXCLUDED.reasons, "lastSeenAt" = EXCLUDED."lastSeenAt"`,
        [
          objectName,
          chunk.map(() => v4()),
          chunk.map((pair) => pair.recordAId),
          chunk.map((pair) => pair.recordBId),
          chunk.map((pair) => pair.confidence),
          chunk.map((pair) => JSON.stringify(pair.reasons)),
          scanStartedAt,
        ],
      );
    }

    if (!isDefined(onlyIds)) {
      await this.coreDataSource.query(
        `DELETE FROM ${schema}."roboostDuplicatePair" WHERE "objectName" = $1 AND status = 'OPEN' AND "lastSeenAt" < $2`,
        [objectName, scanStartedAt],
      );
      await this.coreDataSource.query(
        `INSERT INTO ${schema}."roboostDuplicateSettings" ("objectName", "lastScanAt", "lastScanPairCount")
        VALUES ($1, $2, $3)
        ON CONFLICT ("objectName") DO UPDATE SET "lastScanAt" = EXCLUDED."lastScanAt", "lastScanPairCount" = EXCLUDED."lastScanPairCount"`,
        [objectName, scanStartedAt, candidates.length],
      );
    }

    return candidates.length;
  }

  async scanAll(workspaceId: string) {
    const counts: Record<string, number> = {};

    for (const objectName of ROBOOST_MERGE_OBJECT_NAMES) {
      counts[objectName] = await this.scan({ workspaceId, objectName });
    }

    return counts;
  }

  async scanNow({
    workspaceId,
    actor,
    objectName: rawObjectName,
  }: {
    workspaceId: string;
    actor: RoboostMergeActor;
    objectName: string;
  }) {
    const objectName =
      this.roboostMergeService.assertMergeObject(rawObjectName);

    await this.assertCanManage(workspaceId, actor, objectName);

    return this.scan({ workspaceId, objectName });
  }

  private async summarize(
    context: RoboostMergeObjectContext,
    recordIds: string[],
  ): Promise<Map<string, RoboostDuplicateRecordSummary>> {
    if (recordIds.length === 0) {
      return new Map();
    }

    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.roboostMergeService.table(context)} WHERE id = ANY($1::uuid[]) AND "deletedAt" IS NULL`,
      [recordIds],
    );

    return new Map(
      rows.map((row) => [
        row.id as string,
        {
          id: row.id as string,
          name: this.roboostMergeService.recordName(context, row),
          keyText: this.roboostMergeService.keyText(context, row),
          createdAt: toIso(row.createdAt),
          filledCount: this.roboostMergeService.filledFieldCount(context, row),
        },
      ]),
    );
  }

  // Pairs where both records are still live and the user may merge both
  async listPairs({
    workspaceId,
    actor,
    objectName: rawObjectName,
    status,
  }: {
    workspaceId: string;
    actor: RoboostMergeActor;
    objectName: string;
    status: RoboostDuplicatePairStatus;
  }): Promise<RoboostDuplicatePairItem[]> {
    const objectName =
      this.roboostMergeService.assertMergeObject(rawObjectName);

    await this.assertCanManage(workspaceId, actor, objectName);

    if (!(await this.tablesExist(workspaceId))) {
      return [];
    }

    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostDuplicatePair"
      WHERE "objectName" = $1 AND status = $2
      ORDER BY "detectedAt" DESC LIMIT 5000`,
      [objectName, status],
    );
    const recordIds = [
      ...new Set(
        rows.flatMap((row) => [
          row.recordAId as string,
          row.recordBId as string,
        ]),
      ),
    ];
    const context = await this.roboostMergeService.getObjectContext(
      workspaceId,
      objectName,
    );
    const mergeable = new Set(
      await this.roboostMergeService.filterMergeableIds(
        workspaceId,
        actor.workspaceMemberId,
        objectName,
        recordIds,
      ),
    );
    const summaries = await this.summarize(
      context,
      recordIds.filter((id) => mergeable.has(id)),
    );

    return rows.flatMap((row) => {
      const recordA = summaries.get(row.recordAId as string);
      const recordB = summaries.get(row.recordBId as string);

      if (!isDefined(recordA) || !isDefined(recordB)) {
        return [];
      }

      return [
        {
          id: row.id as string,
          confidence: row.confidence as RoboostDuplicateConfidence,
          reasons: parseJson<RoboostDuplicateRuleKey[]>(row.reasons, []),
          status: row.status as RoboostDuplicatePairStatus,
          detectedAt: toIso(row.detectedAt) as string,
          resolvedAt: toIso(row.resolvedAt),
          resolvedByName: (row.resolvedByName as string | null) ?? null,
          recordA,
          recordB,
        },
      ];
    });
  }

  async openPairCount(
    workspaceId: string,
    actor: RoboostMergeActor,
    objectName: string,
  ) {
    const mergeObject = this.roboostMergeService.assertMergeObject(objectName);

    if (
      (await this.getMergeScope(
        workspaceId,
        actor.workspaceMemberId,
        mergeObject,
      )) === 'NONE'
    ) {
      return 0;
    }

    return (
      await this.listPairs({
        workspaceId,
        actor,
        objectName,
        status: 'OPEN',
      })
    ).length;
  }

  async setRejected({
    workspaceId,
    actor,
    pairId,
    isRejected,
  }: {
    workspaceId: string;
    actor: RoboostMergeActor;
    pairId: string;
    isRejected: boolean;
  }) {
    await this.assertTables(workspaceId);

    const [pair]: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostDuplicatePair" WHERE id = $1`,
      [pairId],
    );

    if (!isDefined(pair)) {
      throw new BadRequestException('Duplicate pair not found');
    }

    const objectName = this.roboostMergeService.assertMergeObject(
      pair.objectName as string,
    );

    await this.assertCanManage(workspaceId, actor, objectName);
    await this.roboostMergeService.assertCanMerge(
      workspaceId,
      actor,
      objectName,
      [pair.recordAId as string, pair.recordBId as string],
    );

    await this.coreDataSource.query(
      `UPDATE ${this.schema(workspaceId)}."roboostDuplicatePair"
      SET status = $2, "resolvedAt" = $3, "resolvedById" = $4, "resolvedByName" = $5
      WHERE id = $1 AND status = $6`,
      isRejected
        ? [
            pairId,
            'REJECTED',
            new Date(),
            actor.workspaceMemberId,
            actor.name,
            'OPEN',
          ]
        : [pairId, 'OPEN', null, null, null, 'REJECTED'],
    );

    return true;
  }

  async markMerged({
    workspaceId,
    objectName,
    primaryId,
    secondaryId,
    mergeId,
    actor,
  }: {
    workspaceId: string;
    objectName: string;
    primaryId: string;
    secondaryId: string;
    mergeId: string;
    actor: RoboostMergeActor;
  }) {
    if (!(await this.tablesExist(workspaceId))) {
      return;
    }

    const [recordAId, recordBId] = [primaryId, secondaryId].sort();

    await this.coreDataSource.query(
      `UPDATE ${this.schema(workspaceId)}."roboostDuplicatePair"
      SET status = 'MERGED', "mergeId" = $4, "resolvedAt" = now(), "resolvedById" = $5, "resolvedByName" = $6
      WHERE "objectName" = $1 AND "recordAId" = $2 AND "recordBId" = $3`,
      [
        objectName,
        recordAId,
        recordBId,
        mergeId,
        actor.workspaceMemberId,
        actor.name,
      ],
    );
  }

  private async assertCanBulkMerge(
    workspaceId: string,
    actor: RoboostMergeActor,
    objectName: RoboostMergeObjectName,
  ) {
    if (
      (await this.getMergeScope(
        workspaceId,
        actor.workspaceMemberId,
        objectName,
      )) !== 'ALL'
    ) {
      throw new ForbiddenException(
        'Bulk merge needs Merge = All on this object',
      );
    }
  }

  // Exact pairs only; the most filled-in record survives, the oldest on a tie
  async bulkPreview({
    workspaceId,
    actor,
    objectName: rawObjectName,
    pairIds,
  }: {
    workspaceId: string;
    actor: RoboostMergeActor;
    objectName: string;
    pairIds?: string[] | null;
  }): Promise<RoboostBulkMergePair[]> {
    const objectName =
      this.roboostMergeService.assertMergeObject(rawObjectName);

    await this.assertCanBulkMerge(workspaceId, actor, objectName);

    const pairs = (
      await this.listPairs({ workspaceId, actor, objectName, status: 'OPEN' })
    ).filter(
      (pair) =>
        pair.confidence === 'EXACT' &&
        (!isNonEmptyArray(pairIds) || pairIds.includes(pair.id)),
    );
    const claimed = new Set<string>();

    return pairs.flatMap((pair) => {
      if (claimed.has(pair.recordA.id) || claimed.has(pair.recordB.id)) {
        return [];
      }

      const isAPrimary =
        pair.recordA.filledCount !== pair.recordB.filledCount
          ? pair.recordA.filledCount > pair.recordB.filledCount
          : (pair.recordA.createdAt ?? '') <= (pair.recordB.createdAt ?? '');
      const primary = isAPrimary ? pair.recordA : pair.recordB;
      const secondary = isAPrimary ? pair.recordB : pair.recordA;

      claimed.add(secondary.id);

      return [
        {
          pairId: pair.id,
          primaryId: primary.id,
          secondaryId: secondary.id,
          primaryName: primary.name,
          secondaryName: secondary.name,
        },
      ];
    });
  }

  async startBulkMerge({
    workspaceId,
    actor,
    objectName: rawObjectName,
    pairIds,
  }: {
    workspaceId: string;
    actor: RoboostMergeActor;
    objectName: string;
    pairIds: string[];
  }): Promise<{ bulkMergeId: string; total: number }> {
    const objectName =
      this.roboostMergeService.assertMergeObject(rawObjectName);
    const pairs = await this.bulkPreview({
      workspaceId,
      actor,
      objectName,
      pairIds,
    });

    if (pairs.length === 0) {
      throw new BadRequestException('No exact pairs to merge');
    }

    const bulkMergeId = v4();

    await this.coreDataSource.query(
      `INSERT INTO ${this.schema(workspaceId)}."roboostBulkMerge" (id, "objectName", total, pairs, "startedById", "startedByName")
      VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
      [
        bulkMergeId,
        objectName,
        pairs.length,
        JSON.stringify(pairs),
        actor.workspaceMemberId,
        actor.name,
      ],
    );

    return { bulkMergeId, total: pairs.length };
  }

  async getBulkMerge(workspaceId: string, bulkMergeId: string) {
    await this.assertTables(workspaceId);

    const [row]: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostBulkMerge" WHERE id = $1`,
      [bulkMergeId],
    );

    if (!isDefined(row)) {
      throw new BadRequestException('Bulk merge not found');
    }

    return {
      id: row.id as string,
      objectName: row.objectName as string,
      status: row.status as 'RUNNING' | 'DONE' | 'FAILED',
      total: row.total as number,
      doneCount: row.doneCount as number,
      failedCount: row.failedCount as number,
      startedByName: (row.startedByName as string | null) ?? null,
      startedById: (row.startedById as string | null) ?? null,
      startedAt: toIso(row.startedAt) as string,
      finishedAt: toIso(row.finishedAt),
      pairs: parseJson<RoboostBulkMergePair[]>(row.pairs, []),
      results: parseJson<RoboostBulkMergeResult[]>(row.results, []),
    };
  }

  async listBulkMerges(workspaceId: string, objectName: string) {
    if (!(await this.tablesExist(workspaceId))) {
      return [];
    }

    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT id FROM ${this.schema(workspaceId)}."roboostBulkMerge" WHERE "objectName" = $1 ORDER BY "startedAt" DESC LIMIT 10`,
      [objectName],
    );

    return Promise.all(
      rows.map((row) => this.getBulkMerge(workspaceId, row.id as string)),
    );
  }

  // Runs in the worker; each pair is its own merge transaction, so one failure doesn't stop the rest
  async runBulkMerge({
    workspaceId,
    bulkMergeId,
    actor,
  }: {
    workspaceId: string;
    bulkMergeId: string;
    actor: RoboostMergeActor;
  }) {
    const bulk = await this.getBulkMerge(workspaceId, bulkMergeId);
    const results: RoboostBulkMergeResult[] = [...bulk.results];
    const handled = new Set(results.map((result) => result.pairId));
    const table = `${this.schema(workspaceId)}."roboostBulkMerge"`;

    for (const pair of bulk.pairs) {
      if (handled.has(pair.pairId)) {
        continue;
      }

      let result: RoboostBulkMergeResult;

      try {
        const primaryId =
          (
            await this.roboostMergeService.mergedInto(
              workspaceId,
              bulk.objectName,
              pair.primaryId,
            )
          )?.primaryId ?? pair.primaryId;
        const secondaryId =
          (
            await this.roboostMergeService.mergedInto(
              workspaceId,
              bulk.objectName,
              pair.secondaryId,
            )
          )?.primaryId ?? pair.secondaryId;

        if (primaryId === secondaryId) {
          result = {
            ...pair,
            status: 'SKIPPED',
            mergeId: null,
            message: 'Already merged',
          };
        } else {
          const { mergeId } = await this.roboostMergeService.merge({
            workspaceId,
            actor,
            objectName: bulk.objectName,
            primaryId,
            secondaryId,
            isBulk: true,
          });

          await this.markMerged({
            workspaceId,
            objectName: bulk.objectName,
            primaryId: pair.primaryId,
            secondaryId: pair.secondaryId,
            mergeId,
            actor,
          });
          result = { ...pair, status: 'MERGED', mergeId, message: null };
        }
      } catch (error) {
        result = {
          ...pair,
          status: 'FAILED',
          mergeId: null,
          message: (error as Error).message,
        };
      }

      results.push(result);
      await this.coreDataSource.query(
        `UPDATE ${table} SET results = $2::jsonb, "doneCount" = $3, "failedCount" = $4 WHERE id = $1`,
        [
          bulkMergeId,
          JSON.stringify(results),
          results.filter((entry) => entry.status !== 'FAILED').length,
          results.filter((entry) => entry.status === 'FAILED').length,
        ],
      );
    }

    await this.coreDataSource.query(
      `UPDATE ${table} SET status = 'DONE', "finishedAt" = now() WHERE id = $1`,
      [bulkMergeId],
    );

    this.logger.log(
      `Workspace ${workspaceId}: bulk merge ${bulkMergeId} finished, ${results.filter((entry) => entry.status === 'MERGED').length}/${bulk.total} merged`,
    );

    return this.getBulkMerge(workspaceId, bulkMergeId);
  }

  async markBulkMergeFailed(workspaceId: string, bulkMergeId: string) {
    await this.coreDataSource.query(
      `UPDATE ${this.schema(workspaceId)}."roboostBulkMerge" SET status = 'FAILED', "finishedAt" = now() WHERE id = $1`,
      [bulkMergeId],
    );
  }

  // Imported records that match an existing record (extra emails and domains included) become open pairs
  async checkImportedRecords({
    workspaceId,
    objectName: rawObjectName,
    importId,
    recordIds,
  }: {
    workspaceId: string;
    objectName: string;
    importId: string | null;
    recordIds: string[];
  }): Promise<number> {
    if (
      !(ROBOOST_MERGE_OBJECT_NAMES as readonly string[]).includes(
        rawObjectName,
      ) ||
      recordIds.length === 0 ||
      !(await this.tablesExist(workspaceId))
    ) {
      return 0;
    }

    const objectName = rawObjectName as RoboostMergeObjectName;

    await this.scan({ workspaceId, objectName, onlyRecordIds: recordIds });

    const [{ count }]: { count: number }[] = await this.coreDataSource.query(
      `SELECT count(DISTINCT x)::int AS count FROM (
        SELECT "recordAId" AS x FROM ${this.schema(workspaceId)}."roboostDuplicatePair" WHERE "objectName" = $1 AND status = 'OPEN' AND "recordAId" = ANY($2::uuid[])
        UNION SELECT "recordBId" FROM ${this.schema(workspaceId)}."roboostDuplicatePair" WHERE "objectName" = $1 AND status = 'OPEN' AND "recordBId" = ANY($2::uuid[])
      ) matched`,
      [objectName, recordIds],
    );

    if (isDefined(importId)) {
      await this.coreDataSource.query(
        `UPDATE ${this.schema(workspaceId)}."roboostImport" SET "duplicateMatchCount" = $2 WHERE id = $1`,
        [importId, count],
      );
    }

    return count;
  }
}
