import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';
import { buildPipelineClone } from 'src/modules/pipeline/utils/build-pipeline-clone.util';

const SALES: PipelineConfig = {
  id: 'sales-id',
  key: 'SALES_PIPELINE',
  name: 'Sales Pipeline',
  description: 'Inbound and outbound deals',
  position: 0,
  objectNameSingular: 'opportunity',
  hubspotPipelineId: 'default',
  rules: {
    limitCreationToStages: {
      enabled: true,
      stageValues: ['SALES_DISCOVERY_STAGE'],
    },
    restrictSkipping: true,
    restrictBackward: false,
    lockEditingInStages: { enabled: false, stageValues: ['SALES_CLOSED_LOST'] },
  },
  stages: [
    {
      id: 'stage-1',
      pipelineId: 'sales-id',
      label: '1. Discovery Stage',
      value: 'SALES_DISCOVERY_STAGE',
      position: 0,
      color: 'blue',
      probability: 10,
      hubspotStageId: '1159464522',
      calcPropsEnabled: false,
      conditionalRules: [],
    },
    {
      id: 'stage-2',
      pipelineId: 'sales-id',
      label: '8. Closed Lost',
      value: 'SALES_CLOSED_LOST',
      position: 1,
      color: null,
      probability: 0,
      hubspotStageId: 'closedlost',
      calcPropsEnabled: false,
      conditionalRules: [],
    },
  ],
};

describe('buildPipelineClone', () => {
  const clone = buildPipelineClone({
    source: SALES,
    takenPipelineKeys: ['SALES_PIPELINE'],
    takenStageValues: ['SALES_DISCOVERY_STAGE', 'SALES_CLOSED_LOST'],
    position: 4,
  });

  it('names the copy and gives it a new key', () => {
    expect(clone.pipeline).toMatchObject({
      name: 'Sales Pipeline (copy)',
      key: 'SALES_COPY_PIPELINE',
      description: 'Inbound and outbound deals',
      position: 4,
    });
  });

  it('copies every stage with its probability and color under new keys', () => {
    expect(
      clone.stages.map(({ label, value, probability, color }) => ({
        label,
        value,
        probability,
        color,
      })),
    ).toEqual([
      {
        label: '1. Discovery Stage',
        value: 'SALES_COPY_DISCOVERY_STAGE',
        probability: 10,
        color: 'blue',
      },
      {
        label: '8. Closed Lost',
        value: 'SALES_COPY_CLOSED_LOST',
        probability: 0,
        color: null,
      },
    ]);
  });

  it('copies the rule settings, pointing at the copied stages', () => {
    expect(clone.pipeline.rules).toEqual({
      limitCreationToStages: {
        enabled: true,
        stageValues: ['SALES_COPY_DISCOVERY_STAGE'],
      },
      restrictSkipping: true,
      restrictBackward: false,
      lockEditingInStages: {
        enabled: false,
        stageValues: ['SALES_COPY_CLOSED_LOST'],
      },
    });
  });

  it('does not reuse a taken key when cloned twice', () => {
    expect(
      buildPipelineClone({
        source: SALES,
        takenPipelineKeys: ['SALES_PIPELINE', 'SALES_COPY_PIPELINE'],
        takenStageValues: [],
        position: 5,
      }).pipeline.key,
    ).toBe('SALES_COPY_2_PIPELINE');
  });
});
