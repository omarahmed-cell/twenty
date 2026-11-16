import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { msg } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import {
  buildPipelineKey,
  buildPipelineStageValue,
  isDefined,
  normalizeConditionalLogicRules,
  normalizePipelineRules,
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
      const key = buildPipelineKey(
        isNonEmptyString(record.name) ? record.name : 'New pipeline',
        takenKeys,
      );

      takenKeys.push(key);

      return {
        ...record,
        key,
        objectNameSingular: isNonEmptyString(record.objectNameSingular)
          ? record.objectNameSingular
          : 'opportunity',
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
    const pipelineKeyById = await this.getPipelineKeyById(
      workspaceId,
      records.map((record) => record.pipelineId).filter(isNonEmptyString),
    );

    return records.map((record) => {
      assertValidProbability(record);

      const pipelineKey = isNonEmptyString(record.pipelineId)
        ? pipelineKeyById.get(record.pipelineId)
        : undefined;

      if (!isDefined(pipelineKey)) {
        throw badRequest(
          'A stage needs an existing pipeline',
          msg`A stage must belong to an existing pipeline.`,
        );
      }

      const value = buildPipelineStageValue({
        pipelineKey,
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
  ): Promise<RecordData> {
    await this.assertCanEdit(authContext);

    if ('value' in data || 'pipelineId' in data || 'pipeline' in data) {
      throw badRequest(
        'Stage value and pipeline cannot change',
        msg`A stage keeps its ID and pipeline; create a new stage instead.`,
      );
    }

    assertValidProbability(data);

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
    const keys: { key: string }[] = await this.coreDataSource.query(
      `SELECT "key" FROM "${getWorkspaceSchemaName(workspaceId)}"."pipeline" WHERE "id" = ANY($1::uuid[])`,
      [ids],
    );
    const dealCount = await this.pipelineConfigService.countDealsUsing({
      workspaceId,
      pipelineKeys: keys.map(({ key }) => key),
    });

    if (dealCount > 0) {
      throw badRequest(
        `${dealCount} deals use this pipeline`,
        msg`${dealCount} deal(s) use this pipeline. Move them to another pipeline before deleting it.`,
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
    const values: { value: string }[] = await this.coreDataSource.query(
      `SELECT "value" FROM "${getWorkspaceSchemaName(workspaceId)}"."pipelineStage" WHERE "id" = ANY($1::uuid[])`,
      [ids],
    );
    const dealCount = await this.pipelineConfigService.countDealsUsing({
      workspaceId,
      stageValues: values.map(({ value }) => value),
    });

    if (dealCount > 0) {
      throw badRequest(
        `${dealCount} deals are in this stage`,
        msg`${dealCount} deal(s) are in this stage. Move them to another stage before deleting it.`,
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

  private async getPipelineKeyById(workspaceId: string, ids: string[]) {
    if (ids.length === 0) {
      return new Map<string, string>();
    }

    const rows: { id: string; key: string }[] = await this.coreDataSource.query(
      `SELECT "id", "key" FROM "${getWorkspaceSchemaName(workspaceId)}"."pipeline"
      WHERE "id" = ANY($1::uuid[]) AND "deletedAt" IS NULL`,
      [ids],
    );

    return new Map(rows.map(({ id, key }) => [id, key]));
  }
}
