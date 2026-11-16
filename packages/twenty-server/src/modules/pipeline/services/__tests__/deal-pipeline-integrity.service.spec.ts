import { DEFAULT_PIPELINE_RULES } from 'twenty-shared/utils';
import { type DataSource } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { DealPipelineIntegrityService } from 'src/modules/pipeline/services/deal-pipeline-integrity.service';
import { type DealPipelineRulesService } from 'src/modules/pipeline/services/deal-pipeline-rules.service';
import { type DealStageEntryRulesService } from 'src/modules/pipeline/services/deal-stage-entry-rules.service';
import { type PipelineConfigService } from 'src/modules/pipeline/services/pipeline-config.service';
import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';

const SALES: PipelineConfig = {
  id: 'sales',
  key: 'SALES_PIPELINE',
  name: 'Sales Pipeline',
  description: null,
  position: 0,
  objectNameSingular: 'opportunity',
  hubspotPipelineId: null,
  rules: DEFAULT_PIPELINE_RULES,
  stages: ['SALES_DISCOVERY', 'SALES_CLOSED_LOST'].map((value, position) => ({
    id: value,
    pipelineId: 'sales',
    label: value,
    value,
    position,
    color: null,
    probability: null,
    hubspotStageId: null,
    calcPropsEnabled: false,
    conditionalRules: [],
  })),
};

const AUTH_CONTEXT = {
  type: 'user',
  workspace: { id: '20202020-1c25-4d02-bf25-6aeccf7ea419' },
} as unknown as WorkspaceAuthContext;

const buildService = () => {
  const calls: string[] = [];
  const dealPipelineRulesService = {
    resolveActor: jest.fn().mockResolvedValue({ kind: 'ADMIN', name: 'Ana' }),
    enforce: jest.fn(async () => {
      calls.push('movement');
    }),
  };
  const dealStageEntryRulesService = {
    enforce: jest.fn(async () => {
      calls.push('entry');
    }),
  };
  const service = new DealPipelineIntegrityService(
    {
      query: jest
        .fn()
        .mockResolvedValue([
          { id: 'deal', pipeline: 'SALES_PIPELINE', stage: 'SALES_DISCOVERY' },
        ]),
    } as unknown as DataSource,
    {
      getPipelines: jest.fn().mockResolvedValue([SALES]),
    } as unknown as PipelineConfigService,
    dealPipelineRulesService as unknown as DealPipelineRulesService,
    dealStageEntryRulesService as unknown as DealStageEntryRulesService,
  );

  return {
    service,
    calls,
    dealPipelineRulesService,
    dealStageEntryRulesService,
  };
};

describe('DealPipelineIntegrityService stage entry rules', () => {
  it('checks the entry rules after the movement rules, with the resulting stage', async () => {
    const { service, calls, dealStageEntryRulesService } = buildService();

    await service.prepareDealUpdate({
      authContext: AUTH_CONTEXT,
      id: 'deal',
      data: { stage: 'SALES_CLOSED_LOST' },
    });

    expect(calls).toEqual(['movement', 'entry']);
    expect(dealStageEntryRulesService.enforce).toHaveBeenCalledWith(
      expect.objectContaining({
        actorKind: 'ADMIN',
        operation: 'update',
        entries: [
          expect.objectContaining({
            recordId: 'deal',
            current: { pipeline: 'SALES_PIPELINE', stage: 'SALES_DISCOVERY' },
            next: { pipeline: 'SALES_PIPELINE', stage: 'SALES_CLOSED_LOST' },
          }),
        ],
      }),
    );
  });

  it('reports a refused move first and never reaches the entry rules', async () => {
    const { service, dealPipelineRulesService, dealStageEntryRulesService } =
      buildService();

    dealPipelineRulesService.enforce.mockRejectedValueOnce(
      new Error("Can't skip"),
    );

    await expect(
      service.prepareDealUpdate({
        authContext: AUTH_CONTEXT,
        id: 'deal',
        data: { stage: 'SALES_CLOSED_LOST' },
      }),
    ).rejects.toThrow("Can't skip");
    expect(dealStageEntryRulesService.enforce).not.toHaveBeenCalled();
  });

  it('marks imported deals so the entry rules let them through', async () => {
    const { service, dealStageEntryRulesService } = buildService();

    await service.prepareDealsToCreate({
      authContext: AUTH_CONTEXT,
      isUpsert: false,
      records: [
        {
          pipeline: 'SALES_PIPELINE',
          stage: 'SALES_CLOSED_LOST',
          createdBy: { source: 'IMPORT' },
        },
      ],
    });

    expect(dealStageEntryRulesService.enforce).toHaveBeenCalledWith(
      expect.objectContaining({ actorKind: 'IMPORT', operation: 'create' }),
    );
  });
});
