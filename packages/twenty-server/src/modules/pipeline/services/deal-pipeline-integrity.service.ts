import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { msg } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import {
  isDefined,
  PIPELINE_OBJECT_DEFINITIONS,
  type PipelineObjectNameSingular,
} from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { DealPipelineRulesService } from 'src/modules/pipeline/services/deal-pipeline-rules.service';
import { DealStageEntryRulesService } from 'src/modules/pipeline/services/deal-stage-entry-rules.service';
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

const isDeal = (objectNameSingular: PipelineObjectNameSingular) =>
  objectNameSingular === 'opportunity';

const toException = (
  resolution: Extract<DealPipelineStageResolution, { status: 'refused' }>,
  objectNameSingular: PipelineObjectNameSingular,
) => {
  const { pipelineName = '', stageLabel = '', value = '' } = resolution;

  switch (resolution.reason) {
    case 'STAGE_NOT_IN_PIPELINE':
      return new CommonQueryRunnerException(
        `Stage ${stageLabel} is not in pipeline ${pipelineName}`,
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        {
          userFriendlyMessage: isDeal(objectNameSingular)
            ? msg`Deal Stage "${stageLabel}" is not a stage of the ${pipelineName} pipeline.`
            : msg`Stage "${stageLabel}" is not a stage of the ${pipelineName} pipeline.`,
        },
      );
    case 'UNKNOWN_STAGE':
      return new CommonQueryRunnerException(
        `Unknown ${isDeal(objectNameSingular) ? 'deal' : objectNameSingular} stage ${value}`,
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

// Runs before every deal or service write the query runners handle: UI, API, workflows and imports
@Injectable()
export class DealPipelineIntegrityService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly pipelineConfigService: PipelineConfigService,
    private readonly dealPipelineRulesService: DealPipelineRulesService,
    private readonly dealStageEntryRulesService: DealStageEntryRulesService,
  ) {}

  async prepareDealsToCreate({
    authContext,
    records,
    isUpsert,
    objectNameSingular = 'opportunity',
  }: {
    authContext: WorkspaceAuthContext;
    records: DealData[];
    isUpsert: boolean;
    objectNameSingular?: PipelineObjectNameSingular;
  }): Promise<DealData[]> {
    const workspaceId = authContext.workspace.id;
    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
      objectNameSingular,
    });
    const actor = await this.dealPipelineRulesService.resolveActor(authContext);

    const existingById = isUpsert
      ? await this.getCurrentValues(
          workspaceId,
          objectNameSingular,
          records.map(({ id }) => id).filter(isNonEmptyString),
        )
      : new Map<string, DealPipelineStage>();

    const prepared: DealData[] = [];

    for (const record of records) {
      const current = isNonEmptyString(record.id)
        ? existingById.get(record.id)
        : undefined;
      const resolved = this.apply({
        pipelines,
        record,
        current,
        objectNameSingular,
      });

      await this.dealPipelineRulesService.enforce({
        workspaceId,
        objectNameSingular,
        actor,
        isImport: isImportRecord(record),
        operation: isDefined(current) ? 'update' : 'create',
        pipelines,
        // A new deal's override is traced by recordCreationOverrides once the row exists
        recordId: isDefined(current) ? record.id : undefined,
        current,
        next: this.toNextValues(resolved, current, objectNameSingular),
        data: record,
      });

      await this.dealStageEntryRulesService.enforce({
        workspaceId,
        objectNameSingular,
        actorKind: isImportRecord(record) ? 'IMPORT' : actor.kind,
        operation: isDefined(current) ? 'update' : 'create',
        pipelines,
        entries: [
          {
            recordId: record.id,
            current,
            next: this.toStageValues(resolved, current),
            data: resolved,
          },
        ],
      });

      prepared.push(resolved);
    }

    return prepared;
  }

  async recordCreationOverrides({
    authContext,
    records,
    objectNameSingular = 'opportunity',
  }: {
    authContext: WorkspaceAuthContext;
    records: DealData[];
    objectNameSingular?: PipelineObjectNameSingular;
  }): Promise<void> {
    const actor = await this.dealPipelineRulesService.resolveActor(authContext);

    if (actor.kind !== 'ADMIN') {
      return;
    }

    const workspaceId = authContext.workspace.id;
    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
      objectNameSingular,
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
        objectNameSingular,
        actor,
        operation: 'create',
        pipelines,
        recordId: record.id,
        next: this.toNextValues(record, undefined, objectNameSingular),
        data: record,
      });
    }
  }

  async prepareDealUpdate({
    authContext,
    id,
    data,
    objectNameSingular = 'opportunity',
  }: {
    authContext: WorkspaceAuthContext;
    id: string;
    data: DealData;
    objectNameSingular?: PipelineObjectNameSingular;
  }): Promise<DealData> {
    const workspaceId = authContext.workspace.id;
    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
      objectNameSingular,
    });
    const current = (
      await this.getCurrentValues(workspaceId, objectNameSingular, [id])
    ).get(id) ?? { pipeline: null, stage: null };
    const resolved =
      'pipeline' in data || 'stage' in data
        ? this.apply({ pipelines, record: data, current, objectNameSingular })
        : data;

    const actor = await this.dealPipelineRulesService.resolveActor(authContext);

    await this.dealPipelineRulesService.enforce({
      workspaceId,
      objectNameSingular,
      actor,
      operation: 'update',
      pipelines,
      recordId: id,
      current,
      next: this.toNextValues(resolved, current, objectNameSingular),
      data,
    });

    await this.dealStageEntryRulesService.enforce({
      workspaceId,
      objectNameSingular,
      actorKind: actor.kind,
      operation: 'update',
      pipelines,
      entries: [
        {
          recordId: id,
          current,
          next: this.toStageValues(resolved, current),
          data: resolved,
        },
      ],
    });

    return resolved;
  }

  async prepareDealsUpdate({
    authContext,
    filter,
    data,
    objectNameSingular = 'opportunity',
  }: {
    authContext: WorkspaceAuthContext;
    filter: unknown;
    data: DealData;
    objectNameSingular?: PipelineObjectNameSingular;
  }): Promise<DealData> {
    const workspaceId = authContext.workspace.id;
    const ids = extractRecordIdsFromFilter(filter);
    const touchesPipelineOrStage = 'pipeline' in data || 'stage' in data;
    const actor = await this.dealPipelineRulesService.resolveActor(authContext);

    if (!isDefined(ids)) {
      if (touchesPipelineOrStage || actor.kind === 'MEMBER') {
        throw new CommonQueryRunnerException(
          'Bulk updates must select records by id',
          CommonQueryRunnerExceptionCode.BAD_REQUEST,
          {
            userFriendlyMessage: isDeal(objectNameSingular)
              ? msg`Select the deals to change, then edit them.`
              : msg`Select the records to change, then edit them.`,
          },
        );
      }

      return data;
    }

    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
      objectNameSingular,
    });
    const currentById = await this.getCurrentValues(
      workspaceId,
      objectNameSingular,
      ids,
    );

    if (touchesPipelineOrStage && !('pipeline' in data)) {
      const currentPipelines = new Set(
        [...currentById.values()].map(({ pipeline }) => pipeline),
      );

      if (currentPipelines.size > 1) {
        throw new CommonQueryRunnerException(
          'Selected records are in different pipelines',
          CommonQueryRunnerExceptionCode.BAD_REQUEST,
          {
            userFriendlyMessage: isDeal(objectNameSingular)
              ? msg`Selected deals are in different pipelines.`
              : msg`Selected records are in different pipelines.`,
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
          objectNameSingular,
        })
      : data;

    for (const [id, current] of currentById) {
      await this.dealPipelineRulesService.enforce({
        workspaceId,
        objectNameSingular,
        actor,
        operation: 'update',
        pipelines,
        recordId: id,
        current,
        next: this.toNextValues(resolved, current, objectNameSingular),
        data,
      });
    }

    await this.dealStageEntryRulesService.enforce({
      workspaceId,
      objectNameSingular,
      actorKind: actor.kind,
      operation: 'update',
      pipelines,
      entries: [...currentById].map(([recordId, current]) => ({
        recordId,
        current,
        next: this.toStageValues(resolved, current),
        data: resolved,
      })),
    });

    return resolved;
  }

  async assertDealsRemovable({
    authContext,
    id,
    filter,
    objectNameSingular = 'opportunity',
  }: {
    authContext: WorkspaceAuthContext;
    id?: string;
    filter?: unknown;
    objectNameSingular?: PipelineObjectNameSingular;
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
          'Bulk deletes must select records by id',
          CommonQueryRunnerExceptionCode.BAD_REQUEST,
          {
            userFriendlyMessage: isDeal(objectNameSingular)
              ? msg`Select the deals to delete.`
              : msg`Select the records to delete.`,
          },
        );
      }

      return;
    }

    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
      objectNameSingular,
    });
    const currentById = await this.getCurrentValues(
      workspaceId,
      objectNameSingular,
      ids,
    );

    for (const [recordId, current] of currentById) {
      await this.dealPipelineRulesService.enforce({
        workspaceId,
        objectNameSingular,
        actor,
        operation: 'delete',
        pipelines,
        recordId,
        current,
      });
    }
  }

  private toStageValues(
    data: DealData,
    current: DealPipelineStage | undefined,
  ) {
    return {
      pipeline:
        'pipeline' in data
          ? (data.pipeline ?? null)
          : (current?.pipeline ?? null),
      stage: 'stage' in data ? (data.stage ?? null) : (current?.stage ?? null),
    };
  }

  private toNextValues(
    data: DealData,
    current: DealPipelineStage | undefined,
    objectNameSingular: PipelineObjectNameSingular,
  ): DealPipelineStage {
    return {
      pipeline:
        'pipeline' in data
          ? (data.pipeline ?? null)
          : (current?.pipeline ?? null),
      stage: 'stage' in data ? (data.stage ?? null) : (current?.stage ?? null),
      ...(PIPELINE_OBJECT_DEFINITIONS[objectNameSingular]
        .hasCloseDateAutomation && 'closeDate' in data
        ? { closeDate: data.closeDate as string | null }
        : {}),
    };
  }

  private apply({
    pipelines,
    record,
    current,
    objectNameSingular,
  }: {
    pipelines: PipelineConfig[];
    record: DealData;
    current: DealPipelineStage | undefined;
    objectNameSingular: PipelineObjectNameSingular;
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
        throw toException(resolution, objectNameSingular);
    }
  }

  private async getCurrentValues(
    workspaceId: string,
    objectNameSingular: PipelineObjectNameSingular,
    ids: string[],
  ): Promise<Map<string, DealPipelineStage>> {
    if (ids.length === 0) {
      return new Map();
    }

    const closeDateColumn = PIPELINE_OBJECT_DEFINITIONS[objectNameSingular]
      .hasCloseDateAutomation
      ? ', "closeDate"'
      : '';
    const rows: (DealPipelineStage & { id: string })[] =
      await this.coreDataSource.query(
        `SELECT "id", "pipeline"::text AS "pipeline", "stage"::text AS "stage"${closeDateColumn}
        FROM "${getWorkspaceSchemaName(workspaceId)}"."${objectNameSingular}" WHERE "id" = ANY($1::uuid[])`,
        [ids],
      );

    return new Map(rows.map(({ id, ...values }) => [id, values]));
  }
}
