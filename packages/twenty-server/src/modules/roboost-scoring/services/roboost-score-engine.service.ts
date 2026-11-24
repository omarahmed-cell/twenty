import { Injectable, Logger } from '@nestjs/common';

import {
  buildRoboostFilterRule,
  computeRoboostScoreBreakdown,
  getRoboostFilterFieldKind,
  isDefined,
  type RoboostFilterField,
  type RoboostRuleSetMatch,
  type RoboostScoreBreakdown,
  type RoboostScoreCondition,
  type RoboostScoreCriteria,
  type RoboostScoreRuleSet,
} from 'twenty-shared/utils';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

import { GraphqlQueryParser } from 'src/engine/api/graphql/graphql-query-runner/graphql-query-parsers/graphql-query.parser';
import { type ObjectRecordFilter } from 'src/engine/api/graphql/workspace-query-builder/interfaces/object-record.interface';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type OrmFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/orm-flat-field-metadata.type';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';

export const ROBOOST_SCORE_BATCH_SIZE = 500;

type ScoredRecord = Record<string, unknown> & { id: string };

type EvaluationContext = {
  fieldsByName: Map<string, OrmFlatFieldMetadata>;
  matchIds: (
    filter: RecordGqlOperationFilter,
    recordIds: string[],
  ) => Promise<Set<string>>;
};

const toFilterField = (field: OrmFlatFieldMetadata): RoboostFilterField => ({
  name: field.name,
  type: field.type,
  relation:
    field.type === 'RELATION'
      ? {
          type: String(
            (field.settings as { relationType?: string } | null)
              ?.relationType ?? '',
          ),
        }
      : null,
});

// Both the list filters and the scores build their SQL from buildRoboostFilterRule and the API's
// own filter parser, so a condition is true for exactly the records the same advanced filter shows
@Injectable()
export class RoboostScoreEngineService {
  private readonly logger = new Logger(RoboostScoreEngineService.name);

  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async runInWorkspace<TResult>(
    workspaceId: string,
    callback: () => Promise<TResult>,
  ): Promise<TResult> {
    return this.workspaceOrmManager.executeInWorkspaceContext(
      callback,
      buildSystemAuthContext(workspaceId),
    );
  }

  // Must run inside runInWorkspace
  getObjectFields(objectName: string): Map<string, OrmFlatFieldMetadata> {
    const context = getWorkspaceContext();
    const objectMetadataId = context.objectIdByNameSingular[objectName];
    const fieldsByName = new Map<string, OrmFlatFieldMetadata>();

    for (const field of Object.values(
      context.flatFieldMetadataMaps.byUniversalIdentifier,
    )) {
      if (isDefined(field) && field.objectMetadataId === objectMetadataId) {
        fieldsByName.set(field.name, field);
      }
    }

    return fieldsByName;
  }

  private buildContext(objectName: string): EvaluationContext {
    const context = getWorkspaceContext();
    const flatObjectMetadata = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: context.objectIdByNameSingular[objectName],
      flatEntityMaps: context.flatObjectMetadataMaps,
    });

    if (!isDefined(flatObjectMetadata)) {
      throw new Error(`Unknown object ${objectName}`);
    }
    const parser = new GraphqlQueryParser(
      flatObjectMetadata,
      context.flatObjectMetadataMaps,
      context.flatFieldMetadataMaps,
    );
    const repository = this.workspaceOrmManager.getRepository<ScoredRecord>(
      objectName,
      { shouldBypassPermissionChecks: true },
    );

    return {
      fieldsByName: this.getObjectFields(objectName),
      matchIds: async (filter, recordIds) => {
        if (recordIds.length === 0) {
          return new Set();
        }
        const queryBuilder = repository.createQueryBuilder(objectName);

        parser.applyFilterToBuilder(queryBuilder, objectName, {
          and: [{ id: { in: recordIds } }, filter],
        } as Partial<ObjectRecordFilter>);
        parser.applyDeletedAtToBuilder(queryBuilder, {});
        queryBuilder.select(`"${objectName}"."id"`, 'id');
        const rows = (await queryBuilder.getRawMany()) as { id: string }[];

        return new Set(rows.map(({ id }) => id));
      },
    };
  }

  private buildConditionFilter(
    condition: RoboostScoreCondition,
    fieldsByName: Map<string, OrmFlatFieldMetadata>,
    now: Date,
  ): RecordGqlOperationFilter | undefined {
    const field = isDefined(condition.fieldName)
      ? fieldsByName.get(condition.fieldName)
      : undefined;

    if (!isDefined(field) || !isDefined(condition.operand)) {
      return undefined;
    }

    return buildRoboostFilterRule({
      field: toFilterField(field),
      operator: condition.operand,
      value: condition.value,
      now,
      selectOptionValues: (
        (field.options as { value: string }[] | null) ?? []
      ).map(({ value }) => value),
    });
  }

  // Each per-value entry is checked on its own, so the record's matching values are known exactly
  private buildRuleSetFilters(
    ruleSet: RoboostScoreRuleSet,
    fieldsByName: Map<string, OrmFlatFieldMetadata>,
    now: Date,
  ): { value: string | null; filter: RecordGqlOperationFilter }[] | null {
    const filters = ruleSet.conditions.map((condition) =>
      this.buildConditionFilter(condition, fieldsByName, now),
    );

    if (filters.length === 0 || filters.some((filter) => !isDefined(filter))) {
      return null;
    }
    if (ruleSet.mode === 'fixed') {
      return [
        { value: null, filter: { and: filters as RecordGqlOperationFilter[] } },
      ];
    }
    const [valueCondition, ...otherConditions] = ruleSet.conditions;
    const field = isDefined(valueCondition?.fieldName)
      ? fieldsByName.get(valueCondition.fieldName)
      : undefined;

    if (!isDefined(valueCondition) || !isDefined(field)) {
      return null;
    }
    const kind = getRoboostFilterFieldKind(toFilterField(field));
    const otherFilters = filters.slice(1) as RecordGqlOperationFilter[];

    return ruleSet.valuePoints.flatMap(({ value }) => {
      const valueFilter = this.buildConditionFilter(
        {
          ...valueCondition,
          operand: kind === 'boolean' ? 'isEqualTo' : 'isAnyOf',
          value: [value],
        },
        fieldsByName,
        now,
      );

      return isDefined(valueFilter) &&
        otherConditions.length === otherFilters.length
        ? [{ value, filter: { and: [valueFilter, ...otherFilters] } }]
        : [];
    });
  }

  // Must run inside runInWorkspace
  async evaluateInContext(
    objectName: string,
    criteria: RoboostScoreCriteria,
    recordIds: string[],
    now: Date = new Date(),
  ): Promise<Map<string, RoboostScoreBreakdown>> {
    const context = this.buildContext(objectName);
    const matchesByRecord = new Map<
      string,
      Record<string, RoboostRuleSetMatch>
    >(recordIds.map((recordId) => [recordId, {}]));

    for (const group of criteria.groups) {
      for (const ruleSet of group.ruleSets) {
        const filters = this.buildRuleSetFilters(
          ruleSet,
          context.fieldsByName,
          now,
        );

        if (filters === null) {
          this.logger.warn(
            `Rule set ${ruleSet.id} on ${objectName} has an unknown property or an incomplete condition; it never matches`,
          );
          continue;
        }

        for (
          let index = 0;
          index < recordIds.length;
          index += ROBOOST_SCORE_BATCH_SIZE
        ) {
          const batch = recordIds.slice(
            index,
            index + ROBOOST_SCORE_BATCH_SIZE,
          );

          for (const { value, filter } of filters) {
            const matched = await context.matchIds(filter, batch);

            for (const recordId of matched) {
              const matches = matchesByRecord.get(recordId);

              if (!isDefined(matches)) {
                continue;
              }
              const current = matches[ruleSet.id] ?? {
                matched: false,
                matchedValues: [],
              };

              matches[ruleSet.id] = {
                matched: true,
                matchedValues: isDefined(value)
                  ? [...current.matchedValues, value]
                  : current.matchedValues,
              };
            }
          }
        }
      }
    }

    return new Map(
      [...matchesByRecord.entries()].map(([recordId, matches]) => [
        recordId,
        computeRoboostScoreBreakdown(criteria, matches),
      ]),
    );
  }

  async evaluate(
    workspaceId: string,
    objectName: string,
    criteria: RoboostScoreCriteria,
    recordIds: string[],
  ): Promise<Map<string, RoboostScoreBreakdown>> {
    return this.runInWorkspace(workspaceId, () =>
      this.evaluateInContext(objectName, criteria, recordIds),
    );
  }

  // The values a tester sees next to each condition, read the same way the API returns them
  async readRecord(
    workspaceId: string,
    objectName: string,
    recordId: string,
  ): Promise<ScoredRecord | null> {
    return this.runInWorkspace(workspaceId, async () =>
      this.workspaceOrmManager
        .getRepository<ScoredRecord>(objectName, {
          shouldBypassPermissionChecks: true,
        })
        .findOne({ where: { id: recordId } }),
    );
  }
}
