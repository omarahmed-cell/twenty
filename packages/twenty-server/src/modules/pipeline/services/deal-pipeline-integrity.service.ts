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
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
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

type DealPipelineStage = { pipeline: string | null; stage: string | null };

const pickInput = (data: DealData) => ({
  ...('pipeline' in data ? { pipeline: data.pipeline ?? null } : {}),
  ...('stage' in data ? { stage: data.stage ?? null } : {}),
});

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
  ) {}

  async prepareDealsToCreate({
    workspaceId,
    records,
    isUpsert,
  }: {
    workspaceId: string;
    records: DealData[];
    isUpsert: boolean;
  }): Promise<DealData[]> {
    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
    });

    const existingById = isUpsert
      ? await this.getCurrentValues(
          workspaceId,
          records.map(({ id }) => id).filter(isNonEmptyString),
        )
      : new Map<string, DealPipelineStage>();

    return records.map((record) =>
      this.apply({
        pipelines,
        record,
        current: isNonEmptyString(record.id)
          ? existingById.get(record.id)
          : undefined,
      }),
    );
  }

  async prepareDealUpdate({
    workspaceId,
    id,
    data,
  }: {
    workspaceId: string;
    id: string;
    data: DealData;
  }): Promise<DealData> {
    if (!('pipeline' in data) && !('stage' in data)) {
      return data;
    }

    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
    });
    const current = (await this.getCurrentValues(workspaceId, [id])).get(id);

    return this.apply({
      pipelines,
      record: data,
      current: current ?? { pipeline: null, stage: null },
    });
  }

  async prepareDealsUpdate({
    workspaceId,
    filter,
    data,
  }: {
    workspaceId: string;
    filter: unknown;
    data: DealData;
  }): Promise<DealData> {
    if (!('pipeline' in data) && !('stage' in data)) {
      return data;
    }

    const ids = extractRecordIdsFromFilter(filter);

    if (!isDefined(ids)) {
      throw new CommonQueryRunnerException(
        'Bulk stage or pipeline updates must select deals by id',
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        {
          userFriendlyMessage: msg`Select the deals to move, then set their stage or pipeline.`,
        },
      );
    }

    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
    });
    const currentById = await this.getCurrentValues(workspaceId, ids);

    if (!('pipeline' in data)) {
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

    return this.apply({
      pipelines,
      record: data,
      current: first ?? { pipeline: null, stage: null },
    });
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
        `SELECT "id", "pipeline"::text AS "pipeline", "stage"::text AS "stage"
        FROM "${getWorkspaceSchemaName(workspaceId)}"."opportunity" WHERE "id" = ANY($1::uuid[])`,
        [ids],
      );

    return new Map(rows.map(({ id, ...values }) => [id, values]));
  }
}
