import { DEFAULT_PIPELINE_RULES } from 'twenty-shared/utils';

import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';
import { resolveDealPipelineStage } from 'src/modules/pipeline/utils/resolve-deal-pipeline-stage.util';

const buildPipeline = (
  key: string,
  name: string,
  stageValues: string[],
): PipelineConfig => ({
  id: key,
  key,
  name,
  description: null,
  position: 0,
  objectNameSingular: 'opportunity',
  hubspotPipelineId: null,
  rules: DEFAULT_PIPELINE_RULES,
  stages: stageValues.map((value, position) => ({
    id: value,
    pipelineId: key,
    label: `Label ${value}`,
    value,
    position,
    color: null,
    probability: null,
    hubspotStageId: null,
    calcPropsEnabled: false,
    conditionalRules: [],
  })),
});

const PIPELINES = [
  buildPipeline('SALES_PIPELINE', 'Sales Pipeline', [
    'SALES_DISCOVERY_STAGE',
    'SALES_COMMERCIAL_AGREEMENT',
  ]),
  buildPipeline('PILOT_PIPELINE', 'Pilot', ['PILOT_DISCOVERY']),
];

describe('resolveDealPipelineStage', () => {
  describe('new deals', () => {
    it('get the first pipeline and its first stage', () => {
      expect(
        resolveDealPipelineStage({ pipelines: PIPELINES, input: {} }),
      ).toEqual({
        status: 'resolved',
        pipeline: 'SALES_PIPELINE',
        stage: 'SALES_DISCOVERY_STAGE',
      });
    });

    it('get the first stage of the pipeline they name', () => {
      expect(
        resolveDealPipelineStage({
          pipelines: PIPELINES,
          input: { pipeline: 'PILOT_PIPELINE' },
        }),
      ).toEqual({
        status: 'resolved',
        pipeline: 'PILOT_PIPELINE',
        stage: 'PILOT_DISCOVERY',
      });
    });

    it('get the pipeline of the stage they name', () => {
      expect(
        resolveDealPipelineStage({
          pipelines: PIPELINES,
          input: { stage: 'PILOT_DISCOVERY' },
        }),
      ).toEqual({
        status: 'resolved',
        pipeline: 'PILOT_PIPELINE',
        stage: 'PILOT_DISCOVERY',
      });
    });

    it('are refused with a stage from another pipeline', () => {
      expect(
        resolveDealPipelineStage({
          pipelines: PIPELINES,
          input: { pipeline: 'SALES_PIPELINE', stage: 'PILOT_DISCOVERY' },
        }),
      ).toMatchObject({
        status: 'refused',
        reason: 'STAGE_NOT_IN_PIPELINE',
        pipelineName: 'Sales Pipeline',
      });
    });

    it('are refused with an unknown stage or pipeline', () => {
      expect(
        resolveDealPipelineStage({
          pipelines: PIPELINES,
          input: { stage: 'NEW' },
        }),
      ).toMatchObject({ status: 'refused', reason: 'UNKNOWN_STAGE' });
      expect(
        resolveDealPipelineStage({
          pipelines: PIPELINES,
          input: { pipeline: 'NOPE' },
        }),
      ).toMatchObject({ status: 'refused', reason: 'UNKNOWN_PIPELINE' });
    });
  });

  describe('updates', () => {
    const current = {
      pipeline: 'SALES_PIPELINE',
      stage: 'SALES_DISCOVERY_STAGE',
    };

    it('leave deals alone when neither stage nor pipeline changes', () => {
      expect(
        resolveDealPipelineStage({ pipelines: PIPELINES, current, input: {} }),
      ).toEqual({ status: 'unchanged' });
      expect(
        resolveDealPipelineStage({
          pipelines: PIPELINES,
          current,
          input: { pipeline: 'SALES_PIPELINE' },
        }),
      ).toEqual({ status: 'unchanged' });
    });

    it('accept a stage of the deal pipeline', () => {
      expect(
        resolveDealPipelineStage({
          pipelines: PIPELINES,
          current,
          input: { stage: 'SALES_COMMERCIAL_AGREEMENT' },
        }),
      ).toEqual({
        status: 'resolved',
        pipeline: 'SALES_PIPELINE',
        stage: 'SALES_COMMERCIAL_AGREEMENT',
      });
    });

    it('refuse a stage of another pipeline', () => {
      expect(
        resolveDealPipelineStage({
          pipelines: PIPELINES,
          current,
          input: { stage: 'PILOT_DISCOVERY' },
        }),
      ).toMatchObject({
        status: 'refused',
        reason: 'STAGE_NOT_IN_PIPELINE',
        pipelineName: 'Sales Pipeline',
        stageLabel: 'Label PILOT_DISCOVERY',
      });
    });

    it('move a deal to the first stage when only its pipeline changes', () => {
      expect(
        resolveDealPipelineStage({
          pipelines: PIPELINES,
          current,
          input: { pipeline: 'PILOT_PIPELINE' },
        }),
      ).toEqual({
        status: 'resolved',
        pipeline: 'PILOT_PIPELINE',
        stage: 'PILOT_DISCOVERY',
      });
    });

    it('accept a new pipeline and one of its stages together', () => {
      expect(
        resolveDealPipelineStage({
          pipelines: PIPELINES,
          current,
          input: { pipeline: 'PILOT_PIPELINE', stage: 'PILOT_DISCOVERY' },
        }),
      ).toMatchObject({ status: 'resolved', pipeline: 'PILOT_PIPELINE' });
    });
  });
});
