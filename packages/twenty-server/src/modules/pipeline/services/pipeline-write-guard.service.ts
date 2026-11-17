import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { msg } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import {
  buildPipelineKey,
  buildPipelineStageValue,
  isDefined,
  isPipelineObjectNameSingular,
  normalizeConditionalLogicRules,
  normalizePipelineRules,
  PIPELINE_OBJECT_DEFINITIONS,
  type PipelineObjectNameSingular,
  STAGE_CALCULATED_PROPERTY_KINDS,
} from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { PipelineAccessService } from 'src/modules/pipeline/services/pipeline-access.service';
import { PipelineConfigService } from 'src/modules/pipeline/services/pipeline-config.service';
import { extractRecordIdsFromFilter } from 'src/modules/pipeline/utils/extract-record-ids-from-filter.util';

type RecordData = Record<string, unknown>;

const badRequest = (
  message: string,
  userFriendlyMessage: ReturnType<typeof msg>,
) =>
  new CommonQueryRunnerException(
    message,
    CommonQueryRunnerExceptionCode.BAD_REQUEST,
    { userFriendlyMessage },
  );

const toPipelineObjectNameSingular = (
  objectNameSingular: unknown,
): PipelineObjectNameSingular =>
  isPipelineObjectNameSingular(objectNameSingular as string | undefined)
    ? (objectNameSingular as PipelineObjectNameSingular)
    : 'opportunity';

const groupByObject = <TRow extends { objectNameSingular?: string }>(
  rows: TRow[],
): Map<PipelineObjectNameSingular, TRow[]> => {
  const rowsByObject = new Map<PipelineObjectNameSingular, TRow[]>();

  for (const row of rows) {
    const objectNameSingular = toPipelineObjectNameSingular(
      row.objectNameSingular,
    );

    rowsByObject.set(objectNameSingular, [
      ...(rowsByObject.get(objectNameSingular) ?? []),
      row,
    ]);
  }

  return rowsByObject;
};

const assertValidProbability = (data: RecordData) => {
  if (!('probability' in data)) {
    return;
  }

  const probability = data.probability;

  if (
    probability === null ||
    (typeof probability === 'number' &&
      Number.isInteger(probability) &&
      probability >= 0 &&
      probability <= 100)
  ) {
    return;
  }

  throw badRequest(
    `Invalid stage probability ${String(probability)}`,
    msg`A stage probability is a whole number from 0 to 100, or blank.`,
  );
};

const assertValidStageCalculatedPropertyKinds = (data: RecordData) => {
  if (!('stageCalculatedPropertyKinds' in data)) {
    return;
  }

  const kinds = data.stageCalculatedPropertyKinds;

  if (
    kinds === null ||
    (Array.isArray(kinds) &&
      kinds.every((kind) =>
        (STAGE_CALCULATED_PROPERTY_KINDS as readonly unknown[]).includes(kind),
      ))
  ) {
    return;
  }

  throw badRequest(
    `Invalid stage calculated property kinds ${JSON.stringify(kinds)}`,
    msg`Stage calculated properties must be a list of known kinds.`,
  );
};

const assertProbabilityAllowed = (
  data: RecordData,
  objectNameSingular: PipelineObjectNameSingular,
) => {
  if (
    !isDefined(data.probability) ||
    PIPELINE_OBJECT_DEFINITIONS[objectNameSingular].hasStageProbability
  ) {
    return;
  }

  throw badRequest(
    `Stages of a ${objectNameSingular} pipeline have no probability`,
    msg`Stages of this pipeline have no probability. Leave it blank.`,
  );
};

// Keys and stage values are stable option values: generated once on create, never edited
@Injectable()
export class PipelineWriteGuardService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly pipelineAccessService: PipelineAccessService,
    private readonly pipelineConfigService: PipelineConfigService,
  ) {}

  async assertCanEdit(authContext: WorkspaceAuthContext) {
    await this.pipelineAccessService.assertCanEditPipelines(authContext);
  }

  async preparePipelinesToCreate(
    authContext: WorkspaceAuthContext,
    records: RecordData[],
  ): Promise<RecordData[]> {
    await this.assertCanEdit(authContext);

    const takenKeys = await this.listColumn(
      authContext.workspace.id,
      'pipeline',
      'key',
    );

    return records.map((record) => {
      if (
        isNonEmptyString(record.objectNameSingular) &&
        !isPipelineObjectNameSingular(record.objectNameSingular)
      ) {
        throw badRequest(
          `Pipelines are not available on ${String(record.objectNameSingular)}`,
          msg`Pipelines are only available on deals and services.`,
        );
      }

      assertValidStageCalculatedPropertyKinds(record);

      const key = buildPipelineKey(
        isNonEmptyString(record.name) ? record.name : 'New pipeline',
        takenKeys,
      );

      takenKeys.push(key);

      return {
        ...record,
        key,
        objectNameSingular: toPipelineObjectNameSingular(
          record.objectNameSingular,
        ),
        rules: normalizePipelineRules(record.rules),
      };
    });
  }

  async preparePipelineUpdate(
    authContext: WorkspaceAuthContext,
    data: RecordData,
  ): Promise<RecordData> {
    await this.assertCanEdit(authContext);

    if ('key' in data || 'objectNameSingular' in data) {
      throw badRequest(
        'Pipeline key and object cannot change',
        msg`The pipeline ID and object cannot be changed.`,
      );
    }

    assertValidStageCalculatedPropertyKinds(data);

    return 'rules' in data
      ? { ...data, rules: normalizePipelineRules(data.rules) }
      : data;
  }

  async preparePipelineStagesToCreate(
    authContext: WorkspaceAuthContext,
    records: RecordData[],
  ): Promise<RecordData[]> {
    await this.assertCanEdit(authContext);

    const workspaceId = authContext.workspace.id;
    const takenValues = await this.listColumn(
      workspaceId,
      'pipelineStage',
      'value',
    );
    const pipelineById = await this.getPipelineById(
      workspaceId,
      records.map((record) => record.pipelineId).filter(isNonEmptyString),
    );

    return records.map((record) => {
      assertValidProbability(record);

      const pipeline = isNonEmptyString(record.pipelineId)
        ? pipelineById.get(record.pipelineId)
        : undefined;

      if (!isDefined(pipeline)) {
        throw badRequest(
          'A stage needs an existing pipeline',
          msg`A stage must belong to an existing pipeline.`,
        );
      }

      assertProbabilityAllowed(record, pipeline.objectNameSingular);

      const value = buildPipelineStageValue({
        pipelineKey: pipeline.key,
        label: isNonEmptyString(record.label) ? record.label : 'New stage',
        existingValues: takenValues,
      });

      takenValues.push(value);

      return {
        ...record,
        value,
        calcPropsEnabled: record.calcPropsEnabled === true,
        conditionalRules: normalizeConditionalLogicRules(
          record.conditionalRules,
        ),
      };
    });
  }

  async preparePipelineStageUpdate(
    authContext: WorkspaceAuthContext,
    data: RecordData,
    target?: { id?: string; filter?: unknown },
  ): Promise<RecordData> {
    await this.assertCanEdit(authContext);

    if ('value' in data || 'pipelineId' in data || 'pipeline' in data) {
      throw badRequest(
        'Stage value and pipeline cannot change',
        msg`A stage keeps its ID and pipeline; create a new stage instead.`,
      );
    }

    assertValidProbability(data);

    const stageId = target?.id;
    const stageIds = isNonEmptyString(stageId)
      ? [stageId]
      : extractRecordIdsFromFilter(target?.filter);

    if (isDefined(data.probability) && isDefined(stageIds)) {
      for (const objectNameSingular of await this.getStageObjectNames(
        authContext.workspace.id,
        stageIds,
      )) {
        assertProbabilityAllowed(data, objectNameSingular);
      }
    }

    return 'conditionalRules' in data
      ? {
          ...data,
          conditionalRules: normalizeConditionalLogicRules(
            data.conditionalRules,
          ),
        }
      : data;
  }

  async assertPipelinesRemovable(
    authContext: WorkspaceAuthContext,
    filterOrId: { id?: string; filter?: unknown },
  ) {
    await this.assertCanEdit(authContext);

    const workspaceId = authContext.workspace.id;
    const ids = this.resolveIds(filterOrId);
    const keys: { key: string; objectNameSingular?: string }[] =
      await this.coreDataSource.query(
        `SELECT "key", "objectNameSingular" FROM "${getWorkspaceSchemaName(workspaceId)}"."pipeline" WHERE "id" = ANY($1::uuid[])`,
        [ids],
      );

    for (const [objectNameSingular, rows] of groupByObject(keys)) {
      const recordCount = await this.pipelineConfigService.countDealsUsing({
        workspaceId,
        objectNameSingular,
        pipelineKeys: rows.map(({ key }) => key),
      });

      if (recordCount === 0) {
        continue;
      }

      throw objectNameSingular === 'opportunity'
        ? badRequest(
            `${recordCount} deals use this pipeline`,
            msg`${recordCount} deal(s) use this pipeline. Move them to another pipeline before deleting it.`,
          )
        : badRequest(
            `${recordCount} records use this pipeline`,
            msg`${recordCount} record(s) use this pipeline. Move them to another pipeline before deleting it.`,
          );
    }
  }

  async assertPipelineStagesRemovable(
    authContext: WorkspaceAuthContext,
    filterOrId: { id?: string; filter?: unknown },
  ) {
    await this.assertCanEdit(authContext);

    const workspaceId = authContext.workspace.id;
    const ids = this.resolveIds(filterOrId);
    const schema = getWorkspaceSchemaName(workspaceId);
    const values: { value: string; objectNameSingular?: string }[] =
      await this.coreDataSource.query(
        `SELECT "stage"."value", "pipeline"."objectNameSingular"
        FROM "${schema}"."pipelineStage" "stage"
        LEFT JOIN "${schema}"."pipeline" "pipeline" ON "pipeline"."id" = "stage"."pipelineId"
        WHERE "stage"."id" = ANY($1::uuid[])`,
        [ids],
      );

    for (const [objectNameSingular, rows] of groupByObject(values)) {
      const recordCount = await this.pipelineConfigService.countDealsUsing({
        workspaceId,
        objectNameSingular,
        stageValues: rows.map(({ value }) => value),
      });

      if (recordCount === 0) {
        continue;
      }

      throw objectNameSingular === 'opportunity'
        ? badRequest(
            `${recordCount} deals are in this stage`,
            msg`${recordCount} deal(s) are in this stage. Move them to another stage before deleting it.`,
          )
        : badRequest(
            `${recordCount} records are in this stage`,
            msg`${recordCount} record(s) are in this stage. Move them to another stage before deleting it.`,
          );
    }
  }

  private resolveIds({ id, filter }: { id?: string; filter?: unknown }) {
    if (isNonEmptyString(id)) {
      return [id];
    }

    const ids = extractRecordIdsFromFilter(filter);

    if (!isDefined(ids)) {
      throw badRequest(
        'Pipelines and stages can only be removed by id',
        msg`Remove pipelines and stages one by one.`,
      );
    }

    return ids;
  }

  private async listColumn(
    workspaceId: string,
    tableName: 'pipeline' | 'pipelineStage',
    columnName: 'key' | 'value',
  ): Promise<string[]> {
    const rows: Record<string, string>[] = await this.coreDataSource.query(
      `SELECT "${columnName}" FROM "${getWorkspaceSchemaName(workspaceId)}"."${tableName}"`,
    );

    return rows.map((row) => row[columnName]);
  }

  private async getPipelineById(workspaceId: string, ids: string[]) {
    if (ids.length === 0) {
      return new Map<
        string,
        { key: string; objectNameSingular: PipelineObjectNameSingular }
      >();
    }

    const rows: { id: string; key: string; objectNameSingular?: string }[] =
      await this.coreDataSource.query(
        `SELECT "id", "key", "objectNameSingular" FROM "${getWorkspaceSchemaName(workspaceId)}"."pipeline"
        WHERE "id" = ANY($1::uuid[]) AND "deletedAt" IS NULL`,
        [ids],
      );

    return new Map(
      rows.map(({ id, key, objectNameSingular }) => [
        id,
        {
          key,
          objectNameSingular: toPipelineObjectNameSingular(objectNameSingular),
        },
      ]),
    );
  }

  private async getStageObjectNames(
    workspaceId: string,
    stageIds: string[],
  ): Promise<PipelineObjectNameSingular[]> {
    const schema = getWorkspaceSchemaName(workspaceId);
    const rows: { objectNameSingular?: string }[] =
      await this.coreDataSource.query(
        `SELECT DISTINCT "pipeline"."objectNameSingular"
        FROM "${schema}"."pipelineStage" "stage"
        JOIN "${schema}"."pipeline" "pipeline" ON "pipeline"."id" = "stage"."pipelineId"
        WHERE "stage"."id" = ANY($1::uuid[])`,
        [stageIds],
      );

    return rows.map(({ objectNameSingular }) =>
      toPipelineObjectNameSingular(objectNameSingular),
    );
  }
}
