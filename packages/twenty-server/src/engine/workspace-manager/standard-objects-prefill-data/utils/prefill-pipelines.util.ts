import { PIPELINE_SEED } from 'twenty-shared/constants';
import { DEFAULT_PIPELINE_RULES } from 'twenty-shared/utils';
import { type EntityManager } from 'typeorm';
import { v4 } from 'uuid';

// Seeds the HubSpot deal pipelines once; a workspace that already has pipelines is left alone
export const prefillPipelines = async (
  entityManager: EntityManager,
  schemaName: string,
): Promise<number> => {
  const [{ count }]: { count: string }[] = await entityManager.query(
    `SELECT count(*) FROM "${schemaName}"."pipeline"`,
  );

  if (Number(count) > 0) {
    return 0;
  }

  for (const [pipelinePosition, pipeline] of PIPELINE_SEED.entries()) {
    const pipelineId = v4();

    await entityManager.query(
      `INSERT INTO "${schemaName}"."pipeline"
        ("id", "name", "key", "objectNameSingular", "hubspotPipelineId", "rules", "position")
      VALUES ($1, $2, $3, 'opportunity', $4, $5, $6)`,
      [
        pipelineId,
        pipeline.name,
        pipeline.key,
        pipeline.hubspotPipelineId,
        JSON.stringify(DEFAULT_PIPELINE_RULES),
        pipelinePosition,
      ],
    );

    for (const [stagePosition, stage] of pipeline.stages.entries()) {
      await entityManager.query(
        `INSERT INTO "${schemaName}"."pipelineStage"
          ("id", "pipelineId", "label", "value", "probability", "hubspotStageId", "calcPropsEnabled",
            "conditionalRules", "position")
        VALUES ($1, $2, $3, $4, $5, $6, false, '[]'::jsonb, $7)`,
        [
          v4(),
          pipelineId,
          stage.label,
          stage.value,
          stage.probability,
          stage.hubspotStageId,
          stagePosition,
        ],
      );
    }
  }

  return PIPELINE_SEED.length;
};
