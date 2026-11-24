import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined, roundRoboostScorePoints } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { TimelineActivityService } from 'src/modules/timeline/services/timeline-activity.service';
import {
  ROBOOST_SCORE_BATCH_SIZE,
  RoboostScoreEngineService,
} from 'src/modules/roboost-scoring/services/roboost-score-engine.service';
import {
  type RoboostScoreResultWrite,
  RoboostScoreStoreService,
} from 'src/modules/roboost-scoring/services/roboost-score-store.service';
import {
  type RoboostScoreRow,
  type RoboostScoreVersionRow,
} from 'src/modules/roboost-scoring/types/roboost-score.type';

type BatchOutcome = { computed: number; changed: number; drifted: string[] };

type LiveScore = { score: RoboostScoreRow; version: RoboostScoreVersionRow };

const sameValue = (first: unknown, second: unknown) => {
  const toNumber = (value: unknown) =>
    value === null || value === undefined || value === ''
      ? null
      : roundRoboostScorePoints(Number(value));

  return toNumber(first) === toNumber(second);
};

export const getRoboostScoreSourceLabel = (
  scoreName: string,
  versionNumber: number | null,
) =>
  `Score: ${scoreName}${isDefined(versionNumber) ? ` v${versionNumber}` : ''}`;

@Injectable()
export class RoboostScoreRecalcService {
  private readonly logger = new Logger(RoboostScoreRecalcService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly roboostScoreStoreService: RoboostScoreStoreService,
    private readonly roboostScoreEngineService: RoboostScoreEngineService,
    private readonly timelineActivityService: TimelineActivityService,
  ) {}

  // Closed Won follows the same rule as the deal's "Is Closed Won": its stage has a 100% probability
  async findClosedWonIds(
    workspaceId: string,
    recordIds: string[],
  ): Promise<Set<string>> {
    if (recordIds.length === 0) {
      return new Set();
    }
    const schema = this.roboostScoreStoreService.schema(workspaceId);
    const rows: { id: string }[] = await this.coreDataSource.query(
      `SELECT o.id FROM ${schema}."opportunity" o
      JOIN ${schema}."pipelineStage" ps ON ps.value = o.stage::text AND ps."deletedAt" IS NULL
      WHERE o.id = ANY($1::uuid[]) AND ps.probability = 100`,
      [recordIds],
    );

    return new Set(rows.map(({ id }) => id));
  }

  async recalculateRecords({
    workspaceId,
    objectName,
    recordIds,
  }: {
    workspaceId: string;
    objectName: string;
    recordIds: string[];
  }): Promise<void> {
    if (!(await this.roboostScoreStoreService.tablesExist(workspaceId))) {
      return;
    }
    const liveScores = await this.roboostScoreStoreService.findLiveScores(
      workspaceId,
      objectName,
    );

    for (const liveScore of liveScores) {
      try {
        await this.processBatch(workspaceId, liveScore, recordIds, false);
      } catch (error) {
        this.logger.error(
          `Score ${liveScore.score.id} could not recalculate ${recordIds.length} record(s): ${error}`,
        );
      }
    }
  }

  async recalculateScore({
    workspaceId,
    scoreId,
    mode,
  }: {
    workspaceId: string;
    scoreId: string;
    mode: 'full' | 'verify';
  }): Promise<{ computed: number; changed: number; drifted: number }> {
    const liveScore = (
      await this.roboostScoreStoreService.findLiveScores(workspaceId)
    ).find(({ score }) => score.id === scoreId);

    if (!isDefined(liveScore)) {
      return { computed: 0, changed: 0, drifted: 0 };
    }
    const { score } = liveScore;
    const schema = this.roboostScoreStoreService.schema(workspaceId);
    const [{ count: total }] = await this.coreDataSource.query(
      `SELECT count(*)::int AS count FROM ${schema}."${score.objectName}" WHERE "deletedAt" IS NULL`,
    );
    const totals = { computed: 0, changed: 0, drifted: 0 };
    const drifted: string[] = [];
    let lastId: string | null = null;

    await this.roboostScoreStoreService.setRecalcProgress(
      workspaceId,
      scoreId,
      {
        status: 'RUNNING',
        total,
      },
    );

    try {
      for (;;) {
        const rows: { id: string }[] = await this.coreDataSource.query(
          `SELECT id FROM ${schema}."${score.objectName}"
          WHERE "deletedAt" IS NULL AND ($1::uuid IS NULL OR id > $1)
          ORDER BY id LIMIT ${ROBOOST_SCORE_BATCH_SIZE}`,
          [lastId],
        );

        if (rows.length === 0) {
          break;
        }
        const outcome = await this.processBatch(
          workspaceId,
          liveScore,
          rows.map(({ id }) => id),
          mode === 'verify',
        );

        totals.computed += outcome.computed;
        totals.changed += outcome.changed;
        drifted.push(...outcome.drifted);
        lastId = rows[rows.length - 1].id;
        await this.roboostScoreStoreService.setRecalcProgress(
          workspaceId,
          scoreId,
          { status: 'PROGRESS', done: totals.computed },
        );
      }
      await this.roboostScoreStoreService.deleteOrphanResults(
        workspaceId,
        scoreId,
        score.objectName,
      );
      await this.roboostScoreStoreService.setRecalcProgress(
        workspaceId,
        scoreId,
        {
          status: 'DONE',
          isFullRecalc: true,
        },
      );
    } catch (error) {
      await this.roboostScoreStoreService.setRecalcProgress(
        workspaceId,
        scoreId,
        {
          status: 'FAILED',
          isFullRecalc: true,
        },
      );
      throw error;
    }

    totals.drifted = drifted.length;
    if (mode === 'verify') {
      await this.roboostScoreStoreService.setVerification(
        workspaceId,
        scoreId,
        drifted.length,
      );
      if (drifted.length > 0) {
        this.logger.warn(
          `Score "${score.name}" (${scoreId}) drifted on ${drifted.length} record(s), now fixed: ${drifted.slice(0, 50).join(', ')}`,
        );
      }
    }

    return totals;
  }

  private async processBatch(
    workspaceId: string,
    { score, version }: LiveScore,
    recordIds: string[],
    isVerify: boolean,
  ): Promise<BatchOutcome> {
    const schema = this.roboostScoreStoreService.schema(workspaceId);

    return this.roboostScoreEngineService.runInWorkspace(
      workspaceId,
      async () => {
        const fields = this.roboostScoreEngineService.getObjectFields(
          score.objectName,
        );
        const linkedField = [...fields.values()].find(
          (field) => field.id === score.linkedFieldMetadataId,
        );

        if (!isDefined(linkedField) || linkedField.type !== 'NUMBER') {
          this.logger.warn(
            `Score ${score.id} has no Number property to write; skipping`,
          );

          return { computed: 0, changed: 0, drifted: [] };
        }
        const existing = await this.roboostScoreStoreService.getResults(
          workspaceId,
          score.id,
          recordIds,
        );
        const closedWonIds =
          score.objectName === 'opportunity'
            ? await this.findClosedWonIds(workspaceId, recordIds)
            : new Set<string>();
        // A frozen result keeps its value and version while the deal stays Closed Won
        const isFrozenNow = (recordId: string) =>
          existing.get(recordId)?.frozen === true && closedWonIds.has(recordId);
        const toCompute = recordIds.filter(
          (recordId) => !isFrozenNow(recordId),
        );
        const breakdowns =
          await this.roboostScoreEngineService.evaluateInContext(
            score.objectName,
            version.criteria,
            toCompute,
          );
        const now = new Date().toISOString();
        const writes: RoboostScoreResultWrite[] = toCompute.flatMap(
          (recordId) => {
            const breakdown = breakdowns.get(recordId);

            if (!isDefined(breakdown)) {
              return [];
            }
            const shouldFreeze =
              score.freezeOnClosedWon && closedWonIds.has(recordId);

            return [
              {
                recordId,
                value: breakdown.total,
                versionId: version.id,
                versionNumber: version.version,
                breakdown,
                frozen: shouldFreeze,
                frozenAt: shouldFreeze ? now : null,
                source: 'SCORE',
              },
            ];
          },
        );
        const targets = new Map<
          string,
          { value: number | null; versionNumber: number | null }
        >([
          ...recordIds
            .filter(isFrozenNow)
            .map(
              (
                recordId,
              ): [
                string,
                { value: number | null; versionNumber: number | null },
              ] => {
                const result = existing.get(recordId);

                return [
                  recordId,
                  {
                    value: result?.value ?? null,
                    versionNumber: result?.versionNumber ?? null,
                  },
                ];
              },
            ),
          ...writes.map(
            (
              write,
            ): [
              string,
              { value: number | null; versionNumber: number | null },
            ] => [
              write.recordId,
              { value: write.value, versionNumber: write.versionNumber },
            ],
          ),
        ]);
        const currentRows: { id: string; value: unknown }[] =
          await this.coreDataSource.query(
            `SELECT id, "${linkedField.name}" AS value FROM ${schema}."${score.objectName}"
          WHERE id = ANY($1::uuid[])`,
            [[...targets.keys()]],
          );
        const changes = currentRows.flatMap(({ id, value }) => {
          const target = targets.get(id);

          return isDefined(target) && !sameValue(value, target.value)
            ? [
                {
                  recordId: id,
                  before: value === null ? null : Number(value),
                  ...target,
                },
              ]
            : [];
        });
        const drifted = isVerify
          ? changes
              .filter(({ recordId }) => existing.has(recordId))
              .map(({ recordId }) => recordId)
          : [];

        await this.roboostScoreStoreService.upsertResults(
          workspaceId,
          score.id,
          writes,
        );
        if (changes.length > 0) {
          // Written without record events: a score is not an edit and must not re-trigger listeners
          await this.coreDataSource.query(
            `UPDATE ${schema}."${score.objectName}" AS t SET "${linkedField.name}" = v.value
          FROM jsonb_to_recordset($1::jsonb) AS v(id uuid, value double precision)
          WHERE t.id = v.id`,
            [
              JSON.stringify(
                changes.map(({ recordId, value }) => ({ id: recordId, value })),
              ),
            ],
          );
          for (const versionNumber of new Set(
            changes.map((change) => change.versionNumber),
          )) {
            await this.timelineActivityService.recordCalculatedFieldChanges({
              workspaceId,
              objectNameSingular: score.objectName,
              calculatedBy: getRoboostScoreSourceLabel(
                score.name,
                versionNumber,
              ),
              changes: changes
                .filter((change) => change.versionNumber === versionNumber)
                .map(({ recordId, before, value }) => ({
                  recordId,
                  fieldName: linkedField.name,
                  before,
                  after: value,
                })),
            });
          }
        }

        return { computed: toCompute.length, changed: changes.length, drifted };
      },
    );
  }
}
