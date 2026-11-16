import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { msg } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { DealPipelineRulesService } from 'src/modules/pipeline/services/deal-pipeline-rules.service';
import { PipelineConfigService } from 'src/modules/pipeline/services/pipeline-config.service';
import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';
import { extractRecordIdsFromFilter } from 'src/modules/pipeline/utils/extract-record-ids-from-filter.util';
import {
  type DealPipelineStageResolution,
  resolveDealPipelineStage,
} from 'src/modules/pipeline/utils/resolve-deal-pipeline-stage.util';

type DealData = Record<string, unknown> & {
  id?: string;
  pipeline?: string | null;
  stage?: string | null;
};

type DealPipelineStage = {
  pipeline: string | null;
  stage: string | null;
  closeDate?: string | Date | null;
};

const pickInput = (data: DealData) => ({
  ...('pipeline' in data ? { pipeline: data.pipeline ?? null } : {}),
  ...('stage' in data ? { stage: data.stage ?? null } : {}),
});

const isImportRecord = (record: DealData) =>
  (record.createdBy as { source?: string } | undefined)?.source === 'IMPORT';

const toException = (
  resolution: Extract<DealPipelineStageResolution, { status: 'refused' }>,
) => {
  const { pipelineName = '', stageLabel = '', value = '' } = resolution;

  switch (resolution.reason) {
    case 'STAGE_NOT_IN_PIPELINE':
      return new CommonQueryRunnerException(
        `Stage ${stageLabel} is not in pipeline ${pipelineName}`,
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        {
          userFriendlyMessage: msg`Deal Stage "${stageLabel}" is not a stage of the ${pipelineName} pipeline.`,
        },
      );
    case 'UNKNOWN_STAGE':
      return new CommonQueryRunnerException(
        `Unknown deal stage ${value}`,
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        {
          userFriendlyMessage: msg`"${value}" is not a stage of any pipeline.`,
        },
      );
    case 'UNKNOWN_PIPELINE':
      return new CommonQueryRunnerException(
        `Unknown pipeline ${value}`,
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        { userFriendlyMessage: msg`"${value}" is not a pipeline.` },
      );
    case 'PIPELINE_WITHOUT_STAGES':
      return new CommonQueryRunnerException(
        `Pipeline ${pipelineName} has no stages`,
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        {
          userFriendlyMessage: msg`The ${pipelineName} pipeline has no stages yet.`,
        },
      );
  }
};

// Runs before every deal write the query runners handle: UI, API, workflows and imports
@Injectable()
export class DealPipelineIntegrityService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly pipelineConfigService: PipelineConfigService,
    private readonly dealPipelineRulesService: DealPipelineRulesService,
  ) {}

  async prepareDealsToCreate({
    authContext,
    records,
    isUpsert,
  }: {
    authContext: WorkspaceAuthContext;
    records: DealData[];
    isUpsert: boolean;
  }): Promise<DealData[]> {
    const workspaceId = authContext.workspace.id;
    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
    });
    const actor = await this.dealPipelineRulesService.resolveActor(authContext);

    const existingById = isUpsert
      ? await this.getCurrentValues(
          workspaceId,
          records.map(({ id }) => id).filter(isNonEmptyString),
        )
      : new Map<string, DealPipelineStage>();

    const prepared: DealData[] = [];

    for (const record of records) {
      const current = isNonEmptyString(record.id)
        ? existingById.get(record.id)
        : undefined;
      const resolved = this.apply({ pipelines, record, current });

      await this.dealPipelineRulesService.enforce({
        workspaceId,
        actor,
        isImport: isImportRecord(record),
        operation: isDefined(current) ? 'update' : 'create',
        pipelines,
        // A new deal's override is traced by recordCreationOverrides once the row exists
        recordId: isDefined(current) ? record.id : undefined,
        current,
        next: this.toNextValues(resolved, current),
        data: record,
      });

      prepared.push(resolved);
    }

    return prepared;
  }

  async recordCreationOverrides({
    authContext,
    records,
  }: {
    authContext: WorkspaceAuthContext;
    records: DealData[];
  }): Promise<void> {
    const actor = await this.dealPipelineRulesService.resolveActor(authContext);

    if (actor.kind !== 'ADMIN') {
      return;
    }

    const workspaceId = authContext.workspace.id;
    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
    });

    for (const record of records) {
      // An upsert that updated an existing deal was already traced before the write
      const isNewRecord =
        new Date(record.createdAt as string).getTime() ===
        new Date(record.updatedAt as string).getTime();

      if (
        !isNewRecord ||
        isImportRecord(record) ||
        !isNonEmptyString(record.id)
      ) {
        continue;
      }

      await this.dealPipelineRulesService.enforce({
        workspaceId,
        actor,
        operation: 'create',
        pipelines,
        recordId: record.id,
        next: this.toNextValues(record, undefined),
        data: record,
      });
    }
  }

  async prepareDealUpdate({
    authContext,
    id,
    data,
  }: {
    authContext: WorkspaceAuthContext;
    id: string;
    data: DealData;
  }): Promise<DealData> {
    const workspaceId = authContext.workspace.id;
    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
    });
    const current = (await this.getCurrentValues(workspaceId, [id])).get(
      id,
    ) ?? { pipeline: null, stage: null };
    const resolved =
      'pipeline' in data || 'stage' in data
        ? this.apply({ pipelines, record: data, current })
        : data;

    await this.dealPipelineRulesService.enforce({
      workspaceId,
      actor: await this.dealPipelineRulesService.resolveActor(authContext),
      operation: 'update',
      pipelines,
      recordId: id,
      current,
      next: this.toNextValues(resolved, current),
      data,
    });

    return resolved;
  }

  async prepareDealsUpdate({
    authContext,
    filter,
    data,
  }: {
    authContext: WorkspaceAuthContext;
    filter: unknown;
    data: DealData;
  }): Promise<DealData> {
    const workspaceId = authContext.workspace.id;
    const ids = extractRecordIdsFromFilter(filter);
    const touchesPipelineOrStage = 'pipeline' in data || 'stage' in data;
    const actor = await this.dealPipelineRulesService.resolveActor(authContext);

    if (!isDefined(ids)) {
      if (touchesPipelineOrStage || actor.kind === 'MEMBER') {
        throw new CommonQueryRunnerException(
          'Bulk deal updates must select deals by id',
          CommonQueryRunnerExceptionCode.BAD_REQUEST,
          {
            userFriendlyMessage: msg`Select the deals to change, then edit them.`,
          },
        );
      }

      return data;
    }

    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
    });
    const currentById = await this.getCurrentValues(workspaceId, ids);

    if (touchesPipelineOrStage && !('pipeline' in data)) {
      const currentPipelines = new Set(
        [...currentById.values()].map(({ pipeline }) => pipeline),
      );

      if (currentPipelines.size > 1) {
        throw new CommonQueryRunnerException(
          'Selected deals are in different pipelines',
          CommonQueryRunnerExceptionCode.BAD_REQUEST,
          {
            userFriendlyMessage: msg`Selected deals are in different pipelines.`,
          },
        );
      }
    }

    const [first] = currentById.values();
    const resolved = touchesPipelineOrStage
      ? this.apply({
          pipelines,
          record: data,
          current: first ?? { pipeline: null, stage: null },
        })
      : data;

    for (const [id, current] of currentById) {
      await this.dealPipelineRulesService.enforce({
        workspaceId,
        actor,
        operation: 'update',
        pipelines,
        recordId: id,
        current,
        next: this.toNextValues(resolved, current),
        data,
      });
    }

    return resolved;
  }

  async assertDealsRemovable({
    authContext,
    id,
    filter,
  }: {
    authContext: WorkspaceAuthContext;
    id?: string;
    filter?: unknown;
  }): Promise<void> {
    const workspaceId = authContext.workspace.id;
    const actor = await this.dealPipelineRulesService.resolveActor(authContext);

    if (actor.kind !== 'MEMBER' && actor.kind !== 'ADMIN') {
      return;
    }

    const ids = isNonEmptyString(id)
      ? [id]
      : extractRecordIdsFromFilter(filter);

    if (!isDefined(ids)) {
      if (actor.kind === 'MEMBER') {
        throw new CommonQueryRunnerException(
          'Bulk deal deletes must select deals by id',
          CommonQueryRunnerExceptionCode.BAD_REQUEST,
          { userFriendlyMessage: msg`Select the deals to delete.` },
        );
      }

      return;
    }

    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
    });
    const currentById = await this.getCurrentValues(workspaceId, ids);

    for (const [recordId, current] of currentById) {
      await this.dealPipelineRulesService.enforce({
        workspaceId,
        actor,
        operation: 'delete',
        pipelines,
        recordId,
        current,
      });
    }
  }

  private toNextValues(
    data: DealData,
    current: DealPipelineStage | undefined,
  ): DealPipelineStage {
    return {
      pipeline:
        'pipeline' in data
          ? (data.pipeline ?? null)
          : (current?.pipeline ?? null),
      stage: 'stage' in data ? (data.stage ?? null) : (current?.stage ?? null),
      ...('closeDate' in data
        ? { closeDate: data.closeDate as string | null }
        : {}),
    };
  }

  private apply({
    pipelines,
    record,
    current,
  }: {
    pipelines: PipelineConfig[];
    record: DealData;
    current: DealPipelineStage | undefined;
  }): DealData {
    const resolution = resolveDealPipelineStage({
      pipelines,
      current,
      input: pickInput(record),
    });

    switch (resolution.status) {
      case 'unchanged':
        return record;
      case 'resolved':
        return {
          ...record,
          pipeline: resolution.pipeline,
          stage: resolution.stage,
        };
      case 'refused':
        throw toException(resolution);
    }
  }

  private async getCurrentValues(
    workspaceId: string,
    ids: string[],
  ): Promise<Map<string, DealPipelineStage>> {
    if (ids.length === 0) {
      return new Map();
    }

    const rows: (DealPipelineStage & { id: string })[] =
      await this.coreDataSource.query(
        `SELECT "id", "pipeline"::text AS "pipeline", "stage"::text AS "stage", "closeDate"
        FROM "${getWorkspaceSchemaName(workspaceId)}"."opportunity" WHERE "id" = ANY($1::uuid[])`,
        [ids],
      );

    return new Map(rows.map(({ id, ...values }) => [id, values]));
  }
}
