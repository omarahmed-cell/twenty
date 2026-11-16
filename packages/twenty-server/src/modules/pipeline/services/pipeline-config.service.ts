import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { normalizePipelineRules } from 'twenty-shared/utils';
import { DataSource, type EntityManager } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';

const UNDEFINED_TABLE_ERROR_CODE = '42P01';

type PipelineRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  position: number;
  objectNameSingular: string;
  hubspotPipelineId: string | null;
  rules: unknown;
};

type PipelineStageRow = {
  id: string;
  pipelineId: string;
  label: string;
  value: string;
  position: number;
  color: string | null;
  probability: number | null;
  hubspotStageId: string | null;
  calcPropsEnabled: boolean;
  conditionalRules: unknown;
};

@Injectable()
export class PipelineConfigService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async getPipelines({
    workspaceId,
    objectNameSingular = 'opportunity',
    manager,
  }: {
    workspaceId: string;
    objectNameSingular?: string;
    manager?: EntityManager;
  }): Promise<PipelineConfig[]> {
    const runner = manager ?? this.coreDataSource;
    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;

    let pipelines: PipelineRow[];

    try {
      pipelines = await runner.query(
        `SELECT "id", "key", "name", "description", "position", "objectNameSingular", "hubspotPipelineId", "rules"
        FROM ${schema}."pipeline"
        WHERE "deletedAt" IS NULL AND "objectNameSingular" = $1
        ORDER BY "position" ASC, "createdAt" ASC`,
        [objectNameSingular],
      );
    } catch (error) {
      // Until the upgrade provisions pipelines, the workspace behaves as if it had none
      if ((error as { code?: string }).code === UNDEFINED_TABLE_ERROR_CODE) {
        return [];
      }

      throw error;
    }

    if (pipelines.length === 0) {
      return [];
    }

    const stages: PipelineStageRow[] = await runner.query(
      `SELECT "id", "pipelineId", "label", "value", "position", "color", "probability", "hubspotStageId",
        "calcPropsEnabled", "conditionalRules"
      FROM ${schema}."pipelineStage"
      WHERE "deletedAt" IS NULL AND "pipelineId" = ANY($1::uuid[])
      ORDER BY "position" ASC, "createdAt" ASC`,
      [pipelines.map(({ id }) => id)],
    );

    return pipelines.map((pipeline) => ({
      ...pipeline,
      position: Number(pipeline.position),
      rules: normalizePipelineRules(pipeline.rules),
      stages: stages
        .filter((stage) => stage.pipelineId === pipeline.id)
        .map((stage) => ({
          ...stage,
          position: Number(stage.position),
          probability:
            stage.probability === null ? null : Number(stage.probability),
        })),
    }));
  }

  async countDealsUsing({
    workspaceId,
    pipelineKeys = [],
    stageValues = [],
  }: {
    workspaceId: string;
    pipelineKeys?: string[];
    stageValues?: string[];
  }): Promise<number> {
    if (pipelineKeys.length === 0 && stageValues.length === 0) {
      return 0;
    }

    // Trashed deals still hold the value, and removing the option would break them
    const [{ count }]: { count: string }[] = await this.coreDataSource.query(
      `SELECT count(*) FROM "${getWorkspaceSchemaName(workspaceId)}"."opportunity"
      WHERE "pipeline"::text = ANY($1::text[]) OR "stage"::text = ANY($2::text[])`,
      [pipelineKeys, stageValues],
    );

    return Number(count);
  }
}
