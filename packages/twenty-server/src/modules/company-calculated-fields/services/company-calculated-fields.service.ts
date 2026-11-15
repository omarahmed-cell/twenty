import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { DataSource, In } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { COMPANY_ACTIVITY_DATE_SOURCES } from 'src/modules/company-calculated-fields/constants/company-activity-date-sources.constant';
import {
  COMPANY_CALCULATED_FIELD_NAMES,
  type CompanyCalculatedFieldValues,
} from 'src/modules/company-calculated-fields/constants/company-calculated-field-names.constant';
import { buildNextActivityCandidateSelects } from 'src/modules/company-calculated-fields/constants/next-activity-date-sources.constant';
import { getClosedTwentyDealStageValues } from 'src/modules/company-calculated-fields/utils/is-open-deal-stage.util';
import {
  type ActivityDateCandidate,
  pickLatestActivityDate,
} from 'src/modules/company-calculated-fields/utils/pick-latest-activity-date.util';
import {
  type NextActivityCandidate,
  pickNextActivityDate,
} from 'src/modules/company-calculated-fields/utils/pick-next-activity-date.util';

const RECOMPUTE_BATCH_SIZE = 500;

type CompanyCalculationRow = {
  id: string;
  current: CompanyCalculatedFieldValues;
  isChildCompany: boolean;
  numberOfChildCompanies: number;
  numberOfAssociatedContacts: number;
  numberOfAssociatedDeals: number;
  numberOfOpenDeals: number;
  activityDates: { activityType: string; date: string | null }[] | null;
  nextActivityCandidates: NextActivityCandidate[] | null;
};

@Injectable()
export class CompanyCalculatedFieldsService {
  private readonly logger = new Logger(CompanyCalculatedFieldsService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
  ) {}

  async resolveCompanyIds({
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
    const companyIds = new Set(recordIdsByObjectName.get('company') ?? []);

    const addCompanyIds = (rows: { companyId: string | null }[]) => {
      for (const { companyId } of rows) {
        if (isDefined(companyId)) {
          companyIds.add(companyId);
        }
      }
    };

    for (const objectName of ['person', 'opportunity']) {
      const recordIds = [...(recordIdsByObjectName.get(objectName) ?? [])];

      if (recordIds.length > 0) {
        addCompanyIds(
          await this.coreDataSource.query(
            `SELECT "companyId" FROM ${schema}."${objectName}" WHERE "id" = ANY($1::uuid[])`,
            [recordIds],
          ),
        );
      }
    }

    // Deleted links still count here: they say which companies just lost an activity
    for (const source of COMPANY_ACTIVITY_DATE_SOURCES) {
      const activityIds = [
        ...(recordIdsByObjectName.get(source.activityType) ?? []),
      ];

      if (activityIds.length === 0) {
        continue;
      }

      addCompanyIds(
        await this.coreDataSource.query(
          `SELECT target."targetCompanyId" AS "companyId" FROM ${schema}."${source.targetTableName}" target
            WHERE target."${source.activityIdColumnName}" = ANY($1::uuid[])
          UNION SELECT person."companyId" FROM ${schema}."${source.targetTableName}" target
            JOIN ${schema}."person" person ON person."id" = target."targetPersonId"
            WHERE target."${source.activityIdColumnName}" = ANY($1::uuid[])
          UNION SELECT opportunity."companyId" FROM ${schema}."${source.targetTableName}" target
            JOIN ${schema}."opportunity" opportunity ON opportunity."id" = target."targetOpportunityId"
            WHERE target."${source.activityIdColumnName}" = ANY($1::uuid[])`,
          [activityIds],
        ),
      );
    }

    return [...companyIds];
  }

  async recomputeCompanies({
    workspaceId,
    companyIds,
  }: {
    workspaceId: string;
    companyIds: string[];
  }): Promise<number> {
    let updatedCount = 0;

    for (
      let offset = 0;
      offset < companyIds.length;
      offset += RECOMPUTE_BATCH_SIZE
    ) {
      updatedCount += await this.recomputeCompanyBatch({
        workspaceId,
        companyIds: companyIds.slice(offset, offset + RECOMPUTE_BATCH_SIZE),
      });
    }

    return updatedCount;
  }

  async recomputeAllCompanies(workspaceId: string): Promise<{
    companyCount: number;
    updatedCount: number;
  }> {
    const rows: { id: string }[] = await this.coreDataSource.query(
      `SELECT "id" FROM "${getWorkspaceSchemaName(workspaceId)}"."company" WHERE "deletedAt" IS NULL`,
    );

    const updatedCount = await this.recomputeCompanies({
      workspaceId,
      companyIds: rows.map(({ id }) => id),
    });

    return { companyCount: rows.length, updatedCount };
  }

  private async recomputeCompanyBatch({
    workspaceId,
    companyIds,
  }: {
    workspaceId: string;
    companyIds: string[];
  }): Promise<number> {
    if (companyIds.length === 0) {
      return 0;
    }

    const rows: CompanyCalculationRow[] = await this.coreDataSource.query(
      this.buildRecomputeQuery(getWorkspaceSchemaName(workspaceId)),
      [companyIds, getClosedTwentyDealStageValues()],
    );

    const now = new Date();
    const changesByCompanyId = new Map<
      string,
      Partial<CompanyCalculatedFieldValues>
    >();

    for (const row of rows) {
      const computed: CompanyCalculatedFieldValues = {
        isParentCompany: row.numberOfChildCompanies > 0,
        isChildCompany: row.isChildCompany,
        numberOfChildCompanies: row.numberOfChildCompanies,
        numberOfAssociatedContacts: row.numberOfAssociatedContacts,
        numberOfAssociatedDeals: row.numberOfAssociatedDeals,
        numberOfOpenDeals: row.numberOfOpenDeals,
        lastActivityDate: pickLatestActivityDate({
          now,
          candidates: (row.activityDates ?? []).map(
            ({ activityType, date }): ActivityDateCandidate => ({
              activityType,
              date,
              countsOnlyOncePast: COMPANY_ACTIVITY_DATE_SOURCES.find(
                (source) => source.activityType === activityType,
              )?.countsOnlyOncePast,
            }),
          ),
        }),
        nextActivityDate: pickNextActivityDate({
          now,
          candidates: row.nextActivityCandidates ?? [],
        }),
      };

      const changes = Object.fromEntries(
        COMPANY_CALCULATED_FIELD_NAMES.filter(
          (fieldName) =>
            !this.isSameValue(row.current[fieldName], computed[fieldName]),
        ).map((fieldName) => [fieldName, computed[fieldName]]),
      );

      if (Object.keys(changes).length > 0) {
        changesByCompanyId.set(row.id, changes);
      }
    }

    if (changesByCompanyId.size === 0) {
      return 0;
    }

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      // Server-computed values stay out of timelines and record-updated triggers
      const companyRepository = this.workspaceOrmManager.getRepository(
        'company',
        { shouldBypassPermissionChecks: true },
        { shouldSkipEventEmission: true },
      );

      for (const [companyId, changes] of changesByCompanyId) {
        await companyRepository.update({ id: In([companyId]) }, changes);
      }
    }, buildSystemAuthContext(workspaceId));

    this.logger.log(
      `Workspace ${workspaceId}: recomputed ${rows.length} compan${rows.length === 1 ? 'y' : 'ies'}, ${changesByCompanyId.size} changed`,
    );

    return changesByCompanyId.size;
  }

  // Dates come back from Postgres in another ISO form, so they compare as instants
  private isSameValue(currentValue: unknown, computedValue: unknown) {
    if (typeof computedValue === 'string') {
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
      SELECT links."companyId", '${source.activityType}' AS "activityType",
        MAX(${source.dateExpression.split('{schema}').join(schema)}) AS "activityDate"
      FROM (
        SELECT target."${source.activityIdColumnName}" AS "activityId", target."targetCompanyId" AS "companyId"
          FROM ${schema}."${source.targetTableName}" target
          WHERE target."deletedAt" IS NULL AND target."targetCompanyId" = ANY($1::uuid[])
        UNION SELECT target."${source.activityIdColumnName}", companyPerson."companyId"
          FROM ${schema}."${source.targetTableName}" target
          JOIN "companyPeople" companyPerson ON companyPerson."id" = target."targetPersonId"
          WHERE target."deletedAt" IS NULL
        UNION SELECT target."${source.activityIdColumnName}", companyOpportunity."companyId"
          FROM ${schema}."${source.targetTableName}" target
          JOIN "companyOpportunities" companyOpportunity ON companyOpportunity."id" = target."targetOpportunityId"
          WHERE target."deletedAt" IS NULL
      ) links
      JOIN ${schema}."${source.activityTableName}" activity
        ON activity."id" = links."activityId" AND activity."deletedAt" IS NULL
      GROUP BY links."companyId"`,
    ).join('\n      UNION ALL');

    const nextActivityCandidateSelects = buildNextActivityCandidateSelects({
      schema,
      ownerSelect: () => 'links."companyId"',
      from: (source) => `(
        SELECT target."${source.activityIdColumnName}" AS "activityId", target."targetCompanyId" AS "companyId"
          FROM ${schema}."${source.targetTableName}" target
          WHERE target."deletedAt" IS NULL AND target."targetCompanyId" = ANY($1::uuid[])
        UNION SELECT target."${source.activityIdColumnName}", companyPerson."companyId"
          FROM ${schema}."${source.targetTableName}" target
          JOIN "companyPeople" companyPerson ON companyPerson."id" = target."targetPersonId"
          WHERE target."deletedAt" IS NULL
        UNION SELECT target."${source.activityIdColumnName}", companyOpportunity."companyId"
          FROM ${schema}."${source.targetTableName}" target
          JOIN "companyOpportunities" companyOpportunity ON companyOpportunity."id" = target."targetOpportunityId"
          WHERE target."deletedAt" IS NULL
      ) links`,
    });

    return `
      WITH "companyPeople" AS (
        SELECT "id", "companyId" FROM ${schema}."person"
        WHERE "companyId" = ANY($1::uuid[]) AND "deletedAt" IS NULL
      ),
      "companyOpportunities" AS (
        SELECT "id", "companyId", "stage"::text AS "stage" FROM ${schema}."opportunity"
        WHERE "companyId" = ANY($1::uuid[]) AND "deletedAt" IS NULL
      ),
      "activityDates" AS (${activityDateSelects}
      ),
      "nextActivityCandidates" AS (${nextActivityCandidateSelects}
      )
      SELECT company."id",
        json_build_object(
          'isParentCompany', company."isParentCompany",
          'isChildCompany', company."isChildCompany",
          'numberOfChildCompanies', company."numberOfChildCompanies",
          'numberOfAssociatedContacts', company."numberOfAssociatedContacts",
          'numberOfAssociatedDeals', company."numberOfAssociatedDeals",
          'numberOfOpenDeals', company."numberOfOpenDeals",
          'lastActivityDate', company."lastActivityDate",
          'nextActivityDate', company."nextActivityDate"
        ) AS "current",
        company."parentCompanyId" IS NOT NULL AS "isChildCompany",
        (SELECT count(*) FROM ${schema}."company" child
          WHERE child."parentCompanyId" = company."id" AND child."deletedAt" IS NULL)::int AS "numberOfChildCompanies",
        (SELECT count(*) FROM "companyPeople" companyPerson
          WHERE companyPerson."companyId" = company."id")::int AS "numberOfAssociatedContacts",
        (SELECT count(*) FROM "companyOpportunities" companyOpportunity
          WHERE companyOpportunity."companyId" = company."id")::int AS "numberOfAssociatedDeals",
        (SELECT count(*) FROM "companyOpportunities" companyOpportunity
          WHERE companyOpportunity."companyId" = company."id"
            AND (companyOpportunity."stage" IS NULL OR NOT (companyOpportunity."stage" = ANY($2::text[]))))::int AS "numberOfOpenDeals",
        (SELECT json_agg(json_build_object('activityType', activityDate."activityType", 'date', activityDate."activityDate"))
          FROM "activityDates" activityDate WHERE activityDate."companyId" = company."id") AS "activityDates",
        (SELECT json_agg(json_build_object('activityType', candidate."activityType", 'date', candidate."date", 'status', candidate."status"))
          FROM "nextActivityCandidates" candidate WHERE candidate."companyId" = company."id") AS "nextActivityCandidates"
      FROM ${schema}."company" company
      WHERE company."id" = ANY($1::uuid[])`;
  }
}
