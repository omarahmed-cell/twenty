import { type DataSource } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type PipelineAccessService } from 'src/modules/pipeline/services/pipeline-access.service';
import { type PipelineConfigService } from 'src/modules/pipeline/services/pipeline-config.service';
import { PipelineWriteGuardService } from 'src/modules/pipeline/services/pipeline-write-guard.service';

const AUTH_CONTEXT = {
  type: 'user',
  workspace: { id: '20202020-1111-4111-8111-111111111111' },
} as unknown as WorkspaceAuthContext;

const buildService = ({
  canEdit = true,
  dealCount = 0,
  rows = [],
}: {
  canEdit?: boolean;
  dealCount?: number;
  rows?: Record<string, string>[];
}) => {
  const query = jest.fn().mockResolvedValue(rows);
  const countDealsUsing = jest.fn().mockResolvedValue(dealCount);
  const assertCanEditPipelines = jest.fn(async () => {
    if (!canEdit) {
      throw new Error('Only workspace admins can change pipelines.');
    }
  });

  return {
    service: new PipelineWriteGuardService(
      { query } as unknown as DataSource,
      { assertCanEditPipelines } as unknown as PipelineAccessService,
      { countDealsUsing } as unknown as PipelineConfigService,
    ),
    countDealsUsing,
  };
};

describe('PipelineWriteGuardService', () => {
  it('blocks deleting a stage that deals are in, saying how many', async () => {
    const { service, countDealsUsing } = buildService({
      dealCount: 3,
      rows: [{ value: 'SALES_CLOSING' }],
    });

    await expect(
      service.assertPipelineStagesRemovable(AUTH_CONTEXT, { id: 'stage-id' }),
    ).rejects.toThrow('3 deals are in this stage');
    expect(countDealsUsing).toHaveBeenCalledWith(
      expect.objectContaining({ stageValues: ['SALES_CLOSING'] }),
    );
  });

  it('blocks deleting a pipeline that deals use', async () => {
    const { service } = buildService({
      dealCount: 12,
      rows: [{ key: 'SALES_PIPELINE' }],
    });

    await expect(
      service.assertPipelinesRemovable(AUTH_CONTEXT, { id: 'pipeline-id' }),
    ).rejects.toThrow('12 deals use this pipeline');
  });

  it('lets an unused stage or pipeline go', async () => {
    const { service } = buildService({ rows: [{ value: 'PILOT_NO_SHOW' }] });

    await expect(
      service.assertPipelineStagesRemovable(AUTH_CONTEXT, {
        filter: { id: { in: ['stage-id'] } },
      }),
    ).resolves.toBeUndefined();
  });

  it('refuses a bulk delete it cannot resolve to ids', async () => {
    const { service } = buildService({});

    await expect(
      service.assertPipelinesRemovable(AUTH_CONTEXT, {
        filter: { name: { eq: 'Pilot' } },
      }),
    ).rejects.toThrow('Pipelines and stages can only be removed by id');
  });

  it('refuses every write from a role other than Admin', async () => {
    const { service } = buildService({ canEdit: false });

    await expect(
      service.preparePipelinesToCreate(AUTH_CONTEXT, [{ name: 'Pilot' }]),
    ).rejects.toThrow('Only workspace admins can change pipelines.');
  });

  it('generates a stable key on create and refuses editing it later', async () => {
    const { service } = buildService({ rows: [{ key: 'PILOT_PIPELINE' }] });

    await expect(
      service.preparePipelinesToCreate(AUTH_CONTEXT, [{ name: 'Pilot' }]),
    ).resolves.toEqual([
      expect.objectContaining({
        key: 'PILOT_2_PIPELINE',
        objectNameSingular: 'opportunity',
      }),
    ]);
    await expect(
      service.preparePipelineUpdate(AUTH_CONTEXT, { key: 'OTHER_PIPELINE' }),
    ).rejects.toThrow('Pipeline key and object cannot change');
  });

  it('refuses a probability outside 0 to 100', async () => {
    const { service } = buildService({});

    await expect(
      service.preparePipelineStageUpdate(AUTH_CONTEXT, { probability: 120 }),
    ).rejects.toThrow('Invalid stage probability 120');
    await expect(
      service.preparePipelineStageUpdate(AUTH_CONTEXT, { probability: null }),
    ).resolves.toEqual({ probability: null });
  });
});
