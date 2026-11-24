import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import {
  buildStageCalculatedPropertyFieldNames,
  isDefined,
  PIPELINE_OBJECT_DEFINITIONS,
  type PipelineObjectNameSingular,
} from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { TimelineActivityService } from 'src/modules/timeline/services/timeline-activity.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import {
  applyDealStageMove,
  computeTimeInCurrentStage,
  type DealStageMove,
  type DealStageProps,
  EMPTY_DEAL_STAGE_PROPS,
  fillEmptyDealStageProps,
  replayDealStageHistory,
} from 'src/modules/deal-stage-history/utils/deal-stage-props.util';

export type DealStageChangeActor = {
  source: string;
  name: string;
  workspaceMemberId: string | null;
};

export type DealStageChange = DealStageMove & {
  recordId: string;
  pipeline: string | null;
  changedBy: DealStageChangeActor;
};

// Only deals have the current stage columns; the writes skip columns an object lacks
type DealRow = Record<string, unknown> & {
  id: string;
  stage: string | null;
  dateEnteredCurrentStage?: Date | string | null;
  timeInCurrentStage?: number | string | null;
};

type HistoryRow = {
  recordId: string;
  fromStage: string | null;
  toStage: string | null;
  changedAt: Date;
};

type StageHistoryTables = {
  recordTable: PipelineObjectNameSingular;
  historyTable: string;
  recordIdColumn: string;
};

const getStageHistoryTables = (
  objectNameSingular: PipelineObjectNameSingular,
): StageHistoryTables => {
  const { stageHistoryObjectNameSingular, stageHistoryRecordFieldName } =
    PIPELINE_OBJECT_DEFINITIONS[objectNameSingular];

  return {
    recordTable: objectNameSingular,
    historyTable: stageHistoryObjectNameSingular,
    recordIdColumn: `${stageHistoryRecordFieldName}Id`,
  };
};

const PROP_KEYS = [
  'dateEntered',
  'dateExited',
  'cumulativeTimeIn',
  'latestTimeIn',
] as const;

const RECOMPUTE_BATCH_SIZE = 500;

const quote = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;

const toIso = (value: unknown) =>
  value instanceof Date
    ? value.toISOString()
    : typeof value === 'string'
      ? new Date(value).toISOString()
      : null;

const toNumber = (value: unknown) =>
  value === null || value === undefined ? null : Number(value);

const isSameValue = (stored: unknown, next: unknown) =>
  stored instanceof Date || typeof next === 'string'
    ? toIso(stored) === toIso(next)
    : toNumber(stored) === toNumber(next);

// Writes go straight to SQL: stage columns stay up to date while their fields are switched off,
// and this bookkeeping must not add timeline entries of its own
@Injectable()
export class DealStageHistoryService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly timelineActivityService: TimelineActivityService,
  ) {}

  async recordStageChanges({
    workspaceId,
    changes,
    objectNameSingular = 'opportunity',
  }: {
    workspaceId: string;
    changes: DealStageChange[];
    objectNameSingular?: PipelineObjectNameSingular;
  }): Promise<void> {
    if (changes.length === 0) {
      return;
    }

    const tables = getStageHistoryTables(objectNameSingular);

    // Service writes can land before the upgrade creates their history table
    if (!(await this.hasHistoryTable(workspaceId, tables))) {
      return;
    }

    const schema = quote(getWorkspaceSchemaName(workspaceId));

    for (const change of changes) {
      await this.coreDataSource.query(
        `INSERT INTO ${schema}.${quote(tables.historyTable)}
          (${quote(tables.recordIdColumn)}, "pipeline", "fromStage", "toStage", "changedAt",
           "changedBySource", "changedByName", "changedByWorkspaceMemberId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          change.recordId,
          change.pipeline,
          change.fromStage,
          change.toStage,
          change.changedAt,
          change.changedBy.source,
          change.changedBy.name,
          change.changedBy.workspaceMemberId,
        ],
      );
    }

    const columnNames = await this.getRecordColumnNames(workspaceId, tables);
    const dealIds = [...new Set(changes.map(({ recordId }) => recordId))];
    const dealById = await this.findDeals({
      workspaceId,
      tables,
      dealIds,
      columnNames,
    });

    for (const dealId of dealIds) {
      const deal = dealById.get(dealId);

      if (!isDefined(deal)) {
        continue;
      }

      const dealChanges = changes
        .filter(({ recordId }) => recordId === dealId)
        .sort((first, second) =>
          first.changedAt.localeCompare(second.changedAt),
        );
      const involvedStages = dealChanges.flatMap(({ fromStage, toStage }) =>
        [fromStage, toStage].filter(isDefined),
      );
      let propsByStage = this.readStageProps({
        deal,
        stageValues: involvedStages,
        columnNames,
      });

      for (const change of dealChanges) {
        propsByStage = {
          ...propsByStage,
          ...applyDealStageMove({ propsByStage, move: change }),
        };
      }

      const lastChange = dealChanges[dealChanges.length - 1];
      const currentStage = lastChange?.toStage ?? null;
      const currentCumulative =
        isDefined(currentStage) && columnNames.has('timeInCurrentStage')
          ? await this.getCumulativeTimeIn({
              workspaceId,
              tables,
              dealId,
              stageValue: currentStage,
              propsByStage,
              columnNames,
            })
          : null;

      await this.writeDeal({
        workspaceId,
        tables,
        deal,
        columnNames,
        values: {
          ...this.toColumnValues(propsByStage, columnNames),
          dateEnteredCurrentStage: isDefined(currentStage)
            ? (lastChange?.changedAt ?? null)
            : null,
          timeInCurrentStage: isDefined(currentStage)
            ? computeTimeInCurrentStage({
                cumulativeTimeIn: currentCumulative,
                dateEnteredCurrentStage: lastChange?.changedAt ?? null,
                now: lastChange?.changedAt ?? new Date().toISOString(),
              })
            : null,
        },
      });
    }
  }

  async recomputeDeals({
    workspaceId,
    dealIds,
  }: {
    workspaceId: string;
    dealIds?: string[];
  }): Promise<{ dealCount: number; updatedCount: number }> {
    const { recordCount, updatedCount } = await this.recomputeRecords({
      workspaceId,
      objectNameSingular: 'opportunity',
      recordIds: dealIds,
    });

    return { dealCount: recordCount, updatedCount };
  }

  // Fills only empty stage values from history (never overwriting loaded values) and refreshes time in current stage
  async recomputeRecords({
    workspaceId,
    objectNameSingular,
    recordIds: dealIds,
  }: {
    workspaceId: string;
    objectNameSingular: PipelineObjectNameSingular;
    recordIds?: string[];
  }): Promise<{ recordCount: number; updatedCount: number }> {
    const tables = getStageHistoryTables(objectNameSingular);
    const columnNames = await this.getRecordColumnNames(workspaceId, tables);

    if (!(await this.hasHistoryTable(workspaceId, tables))) {
      return { recordCount: 0, updatedCount: 0 };
    }

    const schema = quote(getWorkspaceSchemaName(workspaceId));
    const now = new Date().toISOString();
    let dealCount = 0;
    let updatedCount = 0;
    let lastId = '00000000-0000-0000-0000-000000000000';

    for (;;) {
      const ids: { id: string }[] = isDefined(dealIds)
        ? dealIds
            .slice(dealCount, dealCount + RECOMPUTE_BATCH_SIZE)
            .map((id) => ({ id }))
        : await this.coreDataSource.query(
            `SELECT "id" FROM ${schema}.${quote(tables.recordTable)}
             WHERE "deletedAt" IS NULL AND "id" > $1 ORDER BY "id" LIMIT $2`,
            [lastId, RECOMPUTE_BATCH_SIZE],
          );

      if (ids.length === 0) {
        break;
      }

      lastId = ids[ids.length - 1].id;
      dealCount += ids.length;

      const batchIds = ids.map(({ id }) => id);
      const dealById = await this.findDeals({
        workspaceId,
        tables,
        dealIds: batchIds,
        columnNames,
      });
      const historyByDealId = await this.findHistory({
        workspaceId,
        tables,
        dealIds: batchIds,
      });

      for (const deal of dealById.values()) {
        const fromHistory = replayDealStageHistory(
          historyByDealId.get(deal.id) ?? [],
        );
        const stageValues = Object.keys(fromHistory);
        const stored = this.readStageProps({ deal, stageValues, columnNames });
        const filled: Record<string, DealStageProps> = Object.fromEntries(
          stageValues.map((stageValue) => [
            stageValue,
            {
              ...stored[stageValue],
              ...fillEmptyDealStageProps({
                stored: stored[stageValue] ?? EMPTY_DEAL_STAGE_PROPS,
                fromHistory: fromHistory[stageValue],
              }),
            },
          ]),
        );
        const dateEnteredCurrentStage =
          toIso(deal.dateEnteredCurrentStage) ??
          (isDefined(deal.stage)
            ? (fromHistory[deal.stage]?.dateEntered ?? null)
            : null);
        const currentProps = isDefined(deal.stage)
          ? (filled[deal.stage] ??
            this.readStageProps({
              deal,
              stageValues: [deal.stage],
              columnNames,
            })[deal.stage])
          : undefined;

        const hasChanged = await this.writeDeal({
          workspaceId,
          tables,
          deal,
          columnNames,
          values: {
            ...this.toColumnValues(filled, columnNames),
            dateEnteredCurrentStage,
            timeInCurrentStage: computeTimeInCurrentStage({
              cumulativeTimeIn: currentProps?.cumulativeTimeIn ?? null,
              dateEnteredCurrentStage,
              now,
            }),
          },
        });

        if (hasChanged) {
          updatedCount++;
        }
      }

      if (isDefined(dealIds) && dealCount >= dealIds.length) {
        break;
      }
    }

    return { recordCount: dealCount, updatedCount };
  }

  private async hasHistoryTable(
    workspaceId: string,
    tables: StageHistoryTables,
  ): Promise<boolean> {
    const [{ exists }]: { exists: boolean }[] = await this.coreDataSource.query(
      `SELECT to_regclass($1) IS NOT NULL AS "exists"`,
      [
        `${quote(getWorkspaceSchemaName(workspaceId))}.${quote(tables.historyTable)}`,
      ],
    );

    return exists;
  }

  private async getRecordColumnNames(
    workspaceId: string,
    tables: StageHistoryTables,
  ): Promise<Set<string>> {
    const schema = getWorkspaceSchemaName(workspaceId);
    const columns: { column_name: string }[] = await this.coreDataSource.query(
      `SELECT "column_name" FROM information_schema.columns
       WHERE "table_schema" = $1 AND "table_name" = $2`,
      [schema, tables.recordTable],
    );

    // Columns, not active fields: a switched-off stage keeps its columns and keeps being updated
    return new Set(columns.map(({ column_name }) => column_name));
  }

  private async findDeals({
    workspaceId,
    tables,
    dealIds,
    columnNames,
  }: {
    workspaceId: string;
    tables: StageHistoryTables;
    dealIds: string[];
    columnNames: Set<string>;
  }): Promise<Map<string, DealRow>> {
    if (dealIds.length === 0) {
      return new Map();
    }

    const schema = quote(getWorkspaceSchemaName(workspaceId));
    const stageColumns = [...columnNames].filter((columnName) =>
      PROP_KEYS.some((key) => columnName.startsWith(key)),
    );
    const selected = [
      ...new Set([
        'id',
        'stage',
        'dateEnteredCurrentStage',
        'timeInCurrentStage',
        ...stageColumns,
      ]),
    ]
      .filter(
        (columnName) => columnName === 'id' || columnNames.has(columnName),
      )
      .map((columnName) =>
        columnName === 'stage' ? `"stage"::text AS "stage"` : quote(columnName),
      );
    const rows: DealRow[] = await this.coreDataSource.query(
      `SELECT ${selected.join(', ')} FROM ${schema}.${quote(tables.recordTable)} WHERE "id" = ANY($1::uuid[])`,
      [dealIds],
    );

    return new Map(rows.map((row) => [row.id, row]));
  }

  private async findHistory({
    workspaceId,
    tables,
    dealIds,
  }: {
    workspaceId: string;
    tables: StageHistoryTables;
    dealIds: string[];
  }): Promise<Map<string, DealStageMove[]>> {
    const schema = quote(getWorkspaceSchemaName(workspaceId));
    const recordIdColumn = quote(tables.recordIdColumn);
    const rows: HistoryRow[] = await this.coreDataSource.query(
      `SELECT ${recordIdColumn} AS "recordId", "fromStage", "toStage", "changedAt"
       FROM ${schema}.${quote(tables.historyTable)}
       WHERE "deletedAt" IS NULL AND ${recordIdColumn} = ANY($1::uuid[])
       ORDER BY "changedAt" ASC`,
      [dealIds],
    );
    const historyByDealId = new Map<string, DealStageMove[]>();

    for (const row of rows) {
      historyByDealId.set(row.recordId, [
        ...(historyByDealId.get(row.recordId) ?? []),
        {
          fromStage: row.fromStage,
          toStage: row.toStage,
          changedAt: row.changedAt.toISOString(),
        },
      ]);
    }

    return historyByDealId;
  }

  private async getCumulativeTimeIn({
    workspaceId,
    tables,
    dealId,
    stageValue,
    propsByStage,
    columnNames,
  }: {
    workspaceId: string;
    tables: StageHistoryTables;
    dealId: string;
    stageValue: string;
    propsByStage: Record<string, DealStageProps>;
    columnNames: Set<string>;
  }): Promise<number | null> {
    const { cumulativeTimeIn } =
      buildStageCalculatedPropertyFieldNames(stageValue);

    if (columnNames.has(cumulativeTimeIn)) {
      return propsByStage[stageValue]?.cumulativeTimeIn ?? null;
    }

    const history = await this.findHistory({
      workspaceId,
      tables,
      dealIds: [dealId],
    });

    return (
      replayDealStageHistory(history.get(dealId) ?? [])[stageValue]
        ?.cumulativeTimeIn ?? null
    );
  }

  private readStageProps({
    deal,
    stageValues,
    columnNames,
  }: {
    deal: DealRow;
    stageValues: string[];
    columnNames: Set<string>;
  }): Record<string, DealStageProps> {
    return Object.fromEntries(
      stageValues.map((stageValue) => {
        const fieldNames = buildStageCalculatedPropertyFieldNames(stageValue);
        const read = (key: (typeof PROP_KEYS)[number]) =>
          columnNames.has(fieldNames[key]) ? deal[fieldNames[key]] : null;

        return [
          stageValue,
          {
            dateEntered: toIso(read('dateEntered')),
            dateExited: toIso(read('dateExited')),
            cumulativeTimeIn: toNumber(read('cumulativeTimeIn')),
            latestTimeIn: toNumber(read('latestTimeIn')),
          },
        ];
      }),
    );
  }

  private toColumnValues(
    propsByStage: Record<string, DealStageProps>,
    columnNames: Set<string>,
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(propsByStage).flatMap(([stageValue, props]) => {
        const fieldNames = buildStageCalculatedPropertyFieldNames(stageValue);

        return PROP_KEYS.filter((key) => columnNames.has(fieldNames[key])).map(
          (key) => [fieldNames[key], props[key]],
        );
      }),
    );
  }

  private async writeDeal({
    workspaceId,
    tables,
    deal,
    columnNames,
    values,
  }: {
    workspaceId: string;
    tables: StageHistoryTables;
    deal: DealRow;
    columnNames: Set<string>;
    values: Record<string, unknown>;
  }): Promise<boolean> {
    const changed = Object.entries(values).filter(
      ([columnName, value]) =>
        columnNames.has(columnName) && !isSameValue(deal[columnName], value),
    );

    if (changed.length === 0) {
      return false;
    }

    const schema = quote(getWorkspaceSchemaName(workspaceId));

    await this.coreDataSource.query(
      `UPDATE ${schema}.${quote(tables.recordTable)} SET ${changed
        .map(([columnName], index) => `${quote(columnName)} = $${index + 2}`)
        .join(', ')} WHERE "id" = $1`,
      [deal.id, ...changed.map(([, value]) => value)],
    );

    await this.timelineActivityService.recordCalculatedFieldChanges({
      workspaceId,
      objectNameSingular: tables.recordTable,
      changes: changed.map(([fieldName, after]) => ({
        recordId: deal.id,
        fieldName,
        before: deal[fieldName],
        after,
      })),
    });

    return true;
  }
}
