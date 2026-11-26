import { buildLineItemTotalsQuery } from 'src/modules/roboost-catalog/utils/build-line-item-totals-query.util';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { DataSource, In } from 'typeorm';

import { TimelineActivityService } from 'src/modules/timeline/services/timeline-activity.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { DealStageHistoryService } from 'src/modules/deal-stage-history/services/deal-stage-history.service';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { COMPANY_ACTIVITY_DATE_SOURCES } from 'src/modules/company-calculated-fields/constants/company-activity-date-sources.constant';
import { buildNextActivityCandidateSelects } from 'src/modules/company-calculated-fields/constants/next-activity-date-sources.constant';
import {
  OPPORTUNITY_CALCULATED_FIELD_NAMES,
  type OpportunityCalculatedFieldValues,
} from 'src/modules/opportunity-calculated-fields/constants/opportunity-calculated-field-names.constant';
import {
  computeOpportunityCalculatedFieldValues,
  type OpportunityCalculationInput,
} from 'src/modules/opportunity-calculated-fields/utils/compute-opportunity-calculated-field-values.util';

const RECOMPUTE_BATCH_SIZE = 500;

type OpportunityCalculationRow = OpportunityCalculationInput & {
  id: string;
  current: OpportunityCalculatedFieldValues;
};

const CURRENCY_FIELD_NAMES = new Set<string>([
  'weightedAmount',
  'amountInCompanyCurrency',
  'weightedAmountInCompanyCurrency',
]);
const DATE_FIELD_NAMES = new Set<string>([
  'lastActivityDate',
  'nextActivityDate',
]);

// The rate effective on a day: the latest one on or before it (a manual rate wins that day), else the oldest known
const buildRateSubquery = (schema: string, dayExpression: string) => `coalesce(
  (SELECT rate."rate" FROM ${schema}."roboostExchangeRate" rate
    WHERE rate."currencyCode" = opportunity."currency"::text AND rate."effectiveDate" <= ${dayExpression}
    ORDER BY rate."effectiveDate" DESC, (rate."source" = 'MANUAL') DESC, rate."createdAt" DESC LIMIT 1),
  (SELECT rate."rate" FROM ${schema}."roboostExchangeRate" rate
    WHERE rate."currencyCode" = opportunity."currency"::text
    ORDER BY rate."effectiveDate" ASC, (rate."source" = 'MANUAL') DESC LIMIT 1))`;

@Injectable()
export class OpportunityCalculatedFieldsService {
  private readonly logger = new Logger(OpportunityCalculatedFieldsService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly timelineActivityService: TimelineActivityService,
    private readonly dealStageHistoryService: DealStageHistoryService,
  ) {}

  async resolveOpportunityIds({
    workspaceId,
    references,
  }: {
    workspaceId: string;
    references: string[];
  }): Promise<string[]> {
    const recordIdsByObjectName = new Map<string, Set<string>>();

    for (const reference of references) {
      const [objectName, recordId] = reference.split(':');

      if (!isDefined(objectName) || !isDefined(recordId)) {
        continue;
      }

      recordIdsByObjectName.set(
        objectName,
        (recordIdsByObjectName.get(objectName) ?? new Set()).add(recordId),
      );
    }

    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;
    const opportunityIds = new Set(
      recordIdsByObjectName.get('opportunity') ?? [],
    );

    const addOpportunityIds = (rows: { opportunityId: string | null }[]) => {
      for (const { opportunityId } of rows) {
        if (isDefined(opportunityId)) {
          opportunityIds.add(opportunityId);
        }
      }
    };

    const stageValues = [...(recordIdsByObjectName.get('pipelineStage') ?? [])];

    if (stageValues.length > 0) {
      addOpportunityIds(
        await this.coreDataSource.query(
          `SELECT "id" AS "opportunityId" FROM ${schema}."opportunity"
          WHERE "stage"::text = ANY($1::text[]) AND "deletedAt" IS NULL`,
          [stageValues],
        ),
      );
    }

    const personIds = [...(recordIdsByObjectName.get('person') ?? [])];

    if (personIds.length > 0) {
      addOpportunityIds(
        await this.coreDataSource.query(
          `SELECT "opportunityId" FROM ${schema}."opportunityContact" WHERE "personId" = ANY($1::uuid[])
          UNION SELECT "id" FROM ${schema}."opportunity" WHERE "pointOfContactId" = ANY($1::uuid[])`,
          [personIds],
        ),
      );
    }

    // Deleted links still count here: they say which deals just lost an activity
    for (const source of COMPANY_ACTIVITY_DATE_SOURCES) {
      const activityIds = [
        ...(recordIdsByObjectName.get(source.activityType) ?? []),
      ];

      if (activityIds.length > 0) {
        addOpportunityIds(
          await this.coreDataSource.query(
            `SELECT "targetOpportunityId" AS "opportunityId" FROM ${schema}."${source.targetTableName}"
            WHERE "${source.activityIdColumnName}" = ANY($1::uuid[])`,
            [activityIds],
          ),
        );
      }
    }

    return [...opportunityIds];
  }

  async recomputeOpportunities({
    workspaceId,
    opportunityIds,
  }: {
    workspaceId: string;
    opportunityIds: string[];
  }): Promise<number> {
    let updatedCount = 0;

    for (
      let offset = 0;
      offset < opportunityIds.length;
      offset += RECOMPUTE_BATCH_SIZE
    ) {
      updatedCount += await this.recomputeOpportunityBatch({
        workspaceId,
        opportunityIds: opportunityIds.slice(
          offset,
          offset + RECOMPUTE_BATCH_SIZE,
        ),
      });
    }

    return updatedCount;
  }

  async recomputeAllOpportunities(workspaceId: string): Promise<{
    opportunityCount: number;
    updatedCount: number;
  }> {
    const rows: { id: string }[] = await this.coreDataSource.query(
      `SELECT "id" FROM "${getWorkspaceSchemaName(workspaceId)}"."opportunity" WHERE "deletedAt" IS NULL`,
    );

    const updatedCount = await this.recomputeOpportunities({
      workspaceId,
      opportunityIds: rows.map(({ id }) => id),
    });
    const stageHistoryResult =
      await this.dealStageHistoryService.recomputeDeals({ workspaceId });

    return {
      opportunityCount: rows.length,
      updatedCount: updatedCount + stageHistoryResult.updatedCount,
    };
  }

  private async recomputeOpportunityBatch({
    workspaceId,
    opportunityIds,
  }: {
    workspaceId: string;
    opportunityIds: string[];
  }): Promise<number> {
    if (opportunityIds.length === 0) {
      return 0;
    }

    const rows: OpportunityCalculationRow[] = await this.coreDataSource.query(
      this.buildRecomputeQuery(getWorkspaceSchemaName(workspaceId)),
      [opportunityIds],
    );

    const now = new Date();
    const changesByOpportunityId = new Map<
      string,
      Partial<OpportunityCalculatedFieldValues>
    >();

    for (const row of rows) {
      const computed = computeOpportunityCalculatedFieldValues({
        input: row,
        now,
      });

      const changes = Object.fromEntries(
        OPPORTUNITY_CALCULATED_FIELD_NAMES.filter(
          (fieldName) =>
            !this.isSameValue(
              row.current[fieldName],
              computed[fieldName],
              fieldName,
            ),
        ).map((fieldName) => [
          fieldName,
          CURRENCY_FIELD_NAMES.has(fieldName) && !isDefined(computed[fieldName])
            ? { amountMicros: null, currencyCode: null }
            : computed[fieldName],
        ]),
      );

      if (Object.keys(changes).length > 0) {
        changesByOpportunityId.set(row.id, changes);
      }
    }

    if (changesByOpportunityId.size === 0) {
      return 0;
    }

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      // Server-computed values stay out of timelines and record-updated triggers
      const opportunityRepository = this.workspaceOrmManager.getRepository(
        'opportunity',
        { shouldBypassPermissionChecks: true },
        { shouldSkipEventEmission: true },
      );

      for (const [opportunityId, changes] of changesByOpportunityId) {
        await opportunityRepository.update(
          { id: In([opportunityId]) },
          changes,
        );
      }
    }, buildSystemAuthContext(workspaceId));

    await this.coreDataSource.query(
      buildLineItemTotalsQuery(getWorkspaceSchemaName(workspaceId), 'deals'),
      [[...changesByOpportunityId.keys()]],
    );

    await this.timelineActivityService.recordCalculatedFieldChanges({
      workspaceId,
      objectNameSingular: 'opportunity',
      changes: rows.flatMap((row) =>
        Object.entries(changesByOpportunityId.get(row.id) ?? {}).map(
          ([fieldName, after]) => ({
            recordId: row.id,
            fieldName,
            before: row.current[fieldName as keyof typeof row.current],
            after,
          }),
        ),
      ),
    });

    this.logger.log(
      `Workspace ${workspaceId}: recomputed ${rows.length} deal${rows.length === 1 ? '' : 's'}, ${changesByOpportunityId.size} changed`,
    );

    return changesByOpportunityId.size;
  }

  // Dates come back from Postgres in another ISO form, so they compare as instants
  private isSameValue(
    currentValue: unknown,
    computedValue: unknown,
    fieldName: string,
  ) {
    if (
      isDefined(currentValue) &&
      typeof currentValue === 'object' &&
      'amountMicros' in currentValue
    ) {
      const current = currentValue as {
        amountMicros: string | number | null;
        currencyCode: string | null;
      };
      const computed = computedValue as {
        amountMicros: number | null;
        currencyCode: string | null;
      } | null;

      if (!isDefined(computed)) {
        return !isDefined(current.amountMicros);
      }

      return (
        isDefined(current.amountMicros) &&
        Number(current.amountMicros) === computed.amountMicros &&
        (current.currencyCode ?? null) === (computed.currencyCode ?? null)
      );
    }

    if (typeof computedValue === 'number' && isDefined(currentValue)) {
      return Number(currentValue) === computedValue;
    }

    if (typeof computedValue === 'string' && DATE_FIELD_NAMES.has(fieldName)) {
      return (
        isDefined(currentValue) &&
        new Date(currentValue as string).toISOString() === computedValue
      );
    }

    return (currentValue ?? null) === (computedValue ?? null);
  }

  private buildRecomputeQuery(schemaName: string) {
    const schema = `"${schemaName}"`;

    const activityDateSelects = COMPANY_ACTIVITY_DATE_SOURCES.map(
      (source) => `
      SELECT target."targetOpportunityId" AS "opportunityId", '${source.activityType}' AS "activityType",
        MAX(${source.dateExpression.split('{schema}').join(schema)}) AS "activityDate"
      FROM ${schema}."${source.targetTableName}" target
      JOIN ${schema}."${source.activityTableName}" activity
        ON activity."id" = target."${source.activityIdColumnName}" AND activity."deletedAt" IS NULL
      WHERE target."deletedAt" IS NULL AND target."targetOpportunityId" = ANY($1::uuid[])
      GROUP BY target."targetOpportunityId"`,
    ).join('\n      UNION ALL');

    const nextActivityCandidateSelects = buildNextActivityCandidateSelects({
      schema,
      ownerSelect: () => 'links."opportunityId"',
      from: (source) => `(
        SELECT target."${source.activityIdColumnName}" AS "activityId", target."targetOpportunityId" AS "opportunityId"
        FROM ${schema}."${source.targetTableName}" target
        WHERE target."deletedAt" IS NULL AND target."targetOpportunityId" = ANY($1::uuid[])
      ) links`,
    });

    return `
      WITH "activityDates" AS (${activityDateSelects}
      ),
      "nextActivityCandidates" AS (${nextActivityCandidateSelects}
      )
      SELECT opportunity."id",
        json_build_object(
          'lastActivityDate', opportunity."lastActivityDate",
          'nextActivityDate', opportunity."nextActivityDate",
          'numberOfAssociatedContacts', opportunity."numberOfAssociatedContacts",
          'numberOfAssociatedLineItems', opportunity."numberOfAssociatedLineItems",
          'dealProbability', opportunity."dealProbability",
          'weightedAmount', json_build_object(
            'amountMicros', opportunity."weightedAmountAmountMicros",
            'currencyCode', opportunity."weightedAmountCurrencyCode"
          ),
          'isClosed', opportunity."isClosed",
          'isClosedWon', opportunity."isClosedWon",
          'isClosedLost', opportunity."isClosedLost",
          'isOpen', opportunity."isOpen",
          'actualDuration', opportunity."actualDuration",
          'exchangeRate', opportunity."exchangeRate",
          'exchangeRateMode', opportunity."exchangeRateMode",
          'amountInCompanyCurrency', json_build_object(
            'amountMicros', opportunity."amountInCompanyCurrencyAmountMicros",
            'currencyCode', opportunity."amountInCompanyCurrencyCurrencyCode"
          ),
          'weightedAmountInCompanyCurrency', json_build_object(
            'amountMicros', opportunity."weightedAmountInCompanyCurrencyAmountMicros",
            'currencyCode', opportunity."weightedAmountInCompanyCurrencyCurrencyCode"
          )
        ) AS "current",
        (SELECT pipelineStage."probability" FROM ${schema}."pipelineStage" pipelineStage
          WHERE pipelineStage."value" = opportunity."stage"::text AND pipelineStage."deletedAt" IS NULL
          LIMIT 1) AS "stageProbability",
        opportunity."dealAmount",
        opportunity."currency"::text AS "currency",
        opportunity."exchangeRate" AS "currentExchangeRate",
        opportunity."exchangeRateMode"::text AS "currentExchangeRateMode",
        (SELECT currency."code" FROM ${schema}."roboostCurrency" currency
          WHERE currency."isCompanyCurrency" LIMIT 1) AS "companyCurrency",
        ${buildRateSubquery(schema, 'current_date')} AS "latestRate",
        ${buildRateSubquery(schema, 'opportunity."closeDate"::date')} AS "closeDateRate",
        opportunity."createdAt",
        opportunity."closeDate",
        (SELECT pointOfContact."id" FROM ${schema}."person" pointOfContact
          WHERE pointOfContact."id" = opportunity."pointOfContactId" AND pointOfContact."deletedAt" IS NULL) AS "pointOfContactId",
        (SELECT json_agg(opportunityContact."personId") FROM ${schema}."opportunityContact" opportunityContact
          JOIN ${schema}."person" contact ON contact."id" = opportunityContact."personId" AND contact."deletedAt" IS NULL
          WHERE opportunityContact."opportunityId" = opportunity."id" AND opportunityContact."deletedAt" IS NULL) AS "contactPersonIds",
        (SELECT count(*) FROM ${schema}."lineItem" lineItem
          WHERE lineItem."dealId" = opportunity."id" AND lineItem."deletedAt" IS NULL)::int AS "lineItemCount",
        (SELECT json_agg(json_build_object('activityType', activityDate."activityType", 'date', activityDate."activityDate"))
          FROM "activityDates" activityDate WHERE activityDate."opportunityId" = opportunity."id") AS "activityDates",
        (SELECT json_agg(json_build_object('activityType', candidate."activityType", 'date', candidate."date", 'status', candidate."status"))
          FROM "nextActivityCandidates" candidate WHERE candidate."opportunityId" = opportunity."id") AS "nextActivityCandidates"
      FROM ${schema}."opportunity" opportunity
      WHERE opportunity."id" = ANY($1::uuid[])`;
  }
}
