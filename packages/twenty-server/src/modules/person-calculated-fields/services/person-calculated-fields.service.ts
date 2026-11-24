import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { DataSource, In } from 'typeorm';

import { TimelineActivityService } from 'src/modules/timeline/services/timeline-activity.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { COMPANY_ACTIVITY_DATE_SOURCES } from 'src/modules/company-calculated-fields/constants/company-activity-date-sources.constant';
import { buildNextActivityCandidateSelects } from 'src/modules/company-calculated-fields/constants/next-activity-date-sources.constant';
import {
  PERSON_CALCULATED_FIELD_NAMES,
  type PersonCalculatedFieldValues,
} from 'src/modules/person-calculated-fields/constants/person-calculated-field-names.constant';
import {
  computePersonCalculatedFieldValues,
  type PersonCalculationInput,
} from 'src/modules/person-calculated-fields/utils/compute-person-calculated-field-values.util';

const RECOMPUTE_BATCH_SIZE = 500;

type PersonCalculationRow = PersonCalculationInput & {
  id: string;
  current: PersonCalculatedFieldValues;
};

@Injectable()
export class PersonCalculatedFieldsService {
  private readonly logger = new Logger(PersonCalculatedFieldsService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly timelineActivityService: TimelineActivityService,
  ) {}

  async resolvePersonIds({
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
    const personIds = new Set(recordIdsByObjectName.get('person') ?? []);

    const addPersonIds = (rows: { personId: string | null }[]) => {
      for (const { personId } of rows) {
        if (isDefined(personId)) {
          personIds.add(personId);
        }
      }
    };

    const opportunityIds = [
      ...(recordIdsByObjectName.get('opportunity') ?? []),
    ];

    // Deleted links still count here: they say which people just lost a deal or an activity
    if (opportunityIds.length > 0) {
      addPersonIds(
        await this.coreDataSource.query(
          `SELECT "personId" FROM ${schema}."opportunityContact" WHERE "opportunityId" = ANY($1::uuid[])
          UNION SELECT "pointOfContactId" FROM ${schema}."opportunity" WHERE "id" = ANY($1::uuid[])`,
          [opportunityIds],
        ),
      );
    }

    for (const source of COMPANY_ACTIVITY_DATE_SOURCES) {
      const activityIds = [
        ...(recordIdsByObjectName.get(source.activityType) ?? []),
      ];

      if (activityIds.length > 0) {
        addPersonIds(
          await this.coreDataSource.query(
            `SELECT "targetPersonId" AS "personId" FROM ${schema}."${source.targetTableName}"
            WHERE "${source.activityIdColumnName}" = ANY($1::uuid[])`,
            [activityIds],
          ),
        );
      }
    }

    return [...personIds];
  }

  async recomputePeople({
    workspaceId,
    personIds,
  }: {
    workspaceId: string;
    personIds: string[];
  }): Promise<number> {
    let updatedCount = 0;

    for (
      let offset = 0;
      offset < personIds.length;
      offset += RECOMPUTE_BATCH_SIZE
    ) {
      updatedCount += await this.recomputePersonBatch({
        workspaceId,
        personIds: personIds.slice(offset, offset + RECOMPUTE_BATCH_SIZE),
      });
    }

    return updatedCount;
  }

  async recomputeAllPeople(workspaceId: string): Promise<{
    personCount: number;
    updatedCount: number;
  }> {
    const rows: { id: string }[] = await this.coreDataSource.query(
      `SELECT "id" FROM "${getWorkspaceSchemaName(workspaceId)}"."person" WHERE "deletedAt" IS NULL`,
    );

    const updatedCount = await this.recomputePeople({
      workspaceId,
      personIds: rows.map(({ id }) => id),
    });

    return { personCount: rows.length, updatedCount };
  }

  private async recomputePersonBatch({
    workspaceId,
    personIds,
  }: {
    workspaceId: string;
    personIds: string[];
  }): Promise<number> {
    if (personIds.length === 0) {
      return 0;
    }

    const rows: PersonCalculationRow[] = await this.coreDataSource.query(
      this.buildRecomputeQuery(getWorkspaceSchemaName(workspaceId)),
      [personIds],
    );

    const now = new Date();
    const changesByPersonId = new Map<
      string,
      Partial<PersonCalculatedFieldValues>
    >();

    for (const row of rows) {
      const computed = computePersonCalculatedFieldValues({ input: row, now });

      const changes = Object.fromEntries(
        PERSON_CALCULATED_FIELD_NAMES.filter(
          (fieldName) =>
            !this.isSameValue(row.current[fieldName], computed[fieldName]),
        ).map((fieldName) => [fieldName, computed[fieldName]]),
      );

      if (Object.keys(changes).length > 0) {
        changesByPersonId.set(row.id, changes);
      }
    }

    if (changesByPersonId.size === 0) {
      return 0;
    }

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      // Server-computed values stay out of timelines and record-updated triggers
      const personRepository = this.workspaceOrmManager.getRepository(
        'person',
        { shouldBypassPermissionChecks: true },
        { shouldSkipEventEmission: true },
      );

      for (const [personId, changes] of changesByPersonId) {
        await personRepository.update({ id: In([personId]) }, changes);
      }
    }, buildSystemAuthContext(workspaceId));

    await this.timelineActivityService.recordCalculatedFieldChanges({
      workspaceId,
      objectNameSingular: 'person',
      changes: rows.flatMap((row) =>
        Object.entries(changesByPersonId.get(row.id) ?? {}).map(
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
      `Workspace ${workspaceId}: recomputed ${rows.length} ${rows.length === 1 ? 'person' : 'people'}, ${changesByPersonId.size} changed`,
    );

    return changesByPersonId.size;
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
      SELECT target."targetPersonId" AS "personId", '${source.activityType}' AS "activityType",
        MAX(${source.dateExpression.split('{schema}').join(schema)}) AS "activityDate"
      FROM ${schema}."${source.targetTableName}" target
      JOIN ${schema}."${source.activityTableName}" activity
        ON activity."id" = target."${source.activityIdColumnName}" AND activity."deletedAt" IS NULL
      WHERE target."deletedAt" IS NULL AND target."targetPersonId" = ANY($1::uuid[])
      GROUP BY target."targetPersonId"`,
    ).join('\n      UNION ALL');

    const nextActivityCandidateSelects = buildNextActivityCandidateSelects({
      schema,
      ownerSelect: () => 'links."personId"',
      from: (source) => `(
        SELECT target."${source.activityIdColumnName}" AS "activityId", target."targetPersonId" AS "personId"
        FROM ${schema}."${source.targetTableName}" target
        WHERE target."deletedAt" IS NULL AND target."targetPersonId" = ANY($1::uuid[])
      ) links`,
    });

    return `
      WITH "activityDates" AS (${activityDateSelects}
      ),
      "nextActivityCandidates" AS (${nextActivityCandidateSelects}
      )
      SELECT person."id",
        json_build_object(
          'lastActivityDate', person."lastActivityDate",
          'firstDealCreatedDate', person."firstDealCreatedDate",
          'timeInCurrentStage', person."timeInCurrentStage",
          'nextActivityDate', person."nextActivityDate"
        ) AS "current",
        person."lifecycleStage"::text AS "lifecycleStage",
        person."dateEnteredCurrentStage",
        (SELECT json_agg(opportunity."createdAt") FROM ${schema}."opportunity" opportunity
          WHERE opportunity."deletedAt" IS NULL
            AND (opportunity."pointOfContactId" = person."id" OR opportunity."id" IN (
              SELECT opportunityContact."opportunityId" FROM ${schema}."opportunityContact" opportunityContact
              WHERE opportunityContact."personId" = person."id" AND opportunityContact."deletedAt" IS NULL
            ))) AS "dealCreatedDates",
        (SELECT json_agg(json_build_object('activityType', activityDate."activityType", 'date', activityDate."activityDate"))
          FROM "activityDates" activityDate WHERE activityDate."personId" = person."id") AS "activityDates",
        (SELECT json_agg(json_build_object('activityType', candidate."activityType", 'date', candidate."date", 'status', candidate."status"))
          FROM "nextActivityCandidates" candidate WHERE candidate."personId" = person."id") AS "nextActivityCandidates"
      FROM ${schema}."person" person
      WHERE person."id" = ANY($1::uuid[])`;
  }
}
