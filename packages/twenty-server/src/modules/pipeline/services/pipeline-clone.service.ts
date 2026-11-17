import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined, isPipelineObjectNameSingular } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';
import { v4 } from 'uuid';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { DealStageCalculatedPropertiesService } from 'src/modules/pipeline/services/deal-stage-calculated-properties.service';
import { PipelineConfigService } from 'src/modules/pipeline/services/pipeline-config.service';
import { buildPipelineClone } from 'src/modules/pipeline/utils/build-pipeline-clone.util';

@Injectable()
export class PipelineCloneService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly pipelineConfigService: PipelineConfigService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly dealStageCalculatedPropertiesService: DealStageCalculatedPropertiesService,
  ) {}

  async clonePipeline({
    workspaceId,
    pipelineId,
  }: {
    workspaceId: string;
    pipelineId: string;
  }): Promise<string | null> {
    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;
    const [sourceRow]: { objectNameSingular: string }[] =
      await this.coreDataSource.query(
        `SELECT "objectNameSingular" FROM ${schema}."pipeline" WHERE "id" = $1 AND "deletedAt" IS NULL`,
        [pipelineId],
      );
    const objectNameSingular = sourceRow?.objectNameSingular;

    if (!isPipelineObjectNameSingular(objectNameSingular)) {
      return null;
    }

    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
      objectNameSingular,
    });
    const source = pipelines.find((pipeline) => pipeline.id === pipelineId);

    if (!isDefined(source)) {
      return null;
    }

    const [keys, values]: { value: string }[][] = await Promise.all([
      this.coreDataSource.query(
        `SELECT "key" AS "value" FROM ${schema}."pipeline"`,
      ),
      this.coreDataSource.query(
        `SELECT "value" FROM ${schema}."pipelineStage"`,
      ),
    ]);

    const clone = buildPipelineClone({
      source,
      takenPipelineKeys: keys.map(({ value }) => value),
      takenStageValues: values.map(({ value }) => value),
      position: Math.max(0, ...pipelines.map(({ position }) => position)) + 1,
    });

    const newPipelineId = v4();

    // Written through the ORM so the pipeline listener syncs the select options
    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const pipelineRepository = this.workspaceOrmManager.getRepository(
        'pipeline',
        { shouldBypassPermissionChecks: true },
      );
      const pipelineStageRepository = this.workspaceOrmManager.getRepository(
        'pipelineStage',
        { shouldBypassPermissionChecks: true },
      );

      await pipelineRepository.insert({ id: newPipelineId, ...clone.pipeline });

      if (clone.stages.length > 0) {
        await pipelineStageRepository.insert(
          clone.stages.map((stage) => ({
            ...stage,
            pipelineId: newPipelineId,
          })),
        );
      }
    }, buildSystemAuthContext(workspaceId));

    // Cloned stages keep their toggle, and these writes skip the query hooks that sync fields
    await this.dealStageCalculatedPropertiesService.syncFields(
      workspaceId,
      objectNameSingular,
    );

    return newPipelineId;
  }
}
