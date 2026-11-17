import { SERVICE_PIPELINE_SEED } from 'twenty-shared/constants';
import { DEFAULT_PIPELINE_RULES } from 'twenty-shared/utils';
import { type EntityManager } from 'typeorm';
import { v4 } from 'uuid';

// Seeds the HubSpot service pipelines; a pipeline whose key already exists is left alone
export const prefillServicePipelines = async (
  entityManager: EntityManager,
  schemaName: string,
): Promise<number> => {
  let seededCount = 0;

  for (const [pipelinePosition, pipeline] of SERVICE_PIPELINE_SEED.entries()) {
    const [{ count }]: { count: string }[] = await entityManager.query(
      `SELECT count(*) FROM "${schemaName}"."pipeline" WHERE "key" = $1`,
      [pipeline.key],
    );

    if (Number(count) > 0) {
      continue;
    }

    const pipelineId = v4();

    await entityManager.query(
      `INSERT INTO "${schemaName}"."pipeline"
        ("id", "name", "key", "objectNameSingular", "hubspotPipelineId", "rules",
          "stageCalculatedPropertyKinds", "position")
      VALUES ($1, $2, $3, 'service', $4, $5, $6, $7)`,
      [
        pipelineId,
        pipeline.name,
        pipeline.key,
        pipeline.hubspotPipelineId,
        JSON.stringify(DEFAULT_PIPELINE_RULES),
        JSON.stringify(pipeline.stageCalculatedPropertyKinds ?? null),
        pipelinePosition,
      ],
    );

    for (const [stagePosition, stage] of pipeline.stages.entries()) {
      await entityManager.query(
        `INSERT INTO "${schemaName}"."pipelineStage"
          ("id", "pipelineId", "label", "value", "probability", "hubspotStageId", "calcPropsEnabled",
            "conditionalRules", "position")
        VALUES ($1, $2, $3, $4, $5, $6, $7, '[]'::jsonb, $8)`,
        [
          v4(),
          pipelineId,
          stage.label,
          stage.value,
          stage.probability,
          stage.hubspotStageId,
          stage.calcPropsEnabled ?? false,
          stagePosition,
        ],
      );
    }

    seededCount++;
  }

  return seededCount;
};
