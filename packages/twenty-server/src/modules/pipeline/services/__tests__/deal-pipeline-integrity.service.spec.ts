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

const ONBOARDING: PipelineConfig = {
  ...SALES,
  id: 'onboarding',
  key: 'ONBOARDING_PIPELINE',
  name: 'Onboarding Pipeline',
  objectNameSingular: 'service',
  stageCalculatedPropertyKinds: ['dateEntered', 'dateExited'],
  stages: ['ONBOARDING_KICK_OFF', 'ONBOARDING_LIVE'].map((value, position) => ({
    ...SALES.stages[0],
    id: value,
    pipelineId: 'onboarding',
    label: value,
    value,
    position,
  })),
};

const RENEWALS: PipelineConfig = {
  ...ONBOARDING,
  id: 'renewals',
  key: 'RENEWALS_PIPELINE',
  name: 'Renewals Pipeline',
  stages: [
    {
      ...ONBOARDING.stages[0],
      id: 'RENEWALS_OPEN',
      pipelineId: 'renewals',
      label: 'Open',
      value: 'RENEWALS_OPEN',
    },
  ],
};

const buildServiceForServices = () => {
  const query = jest.fn().mockResolvedValue([
    {
      id: 'service-record',
      pipeline: 'ONBOARDING_PIPELINE',
      stage: 'ONBOARDING_KICK_OFF',
    },
  ]);
  const getPipelines = jest.fn().mockResolvedValue([ONBOARDING, RENEWALS]);
  const service = new DealPipelineIntegrityService(
    { query } as unknown as DataSource,
    { getPipelines } as unknown as PipelineConfigService,
    {
      resolveActor: jest
        .fn()
        .mockResolvedValue({ kind: 'MEMBER', name: 'Ana' }),
      enforce: jest.fn(),
    } as unknown as DealPipelineRulesService,
    { enforce: jest.fn() } as unknown as DealStageEntryRulesService,
  );

  return { service, query, getPipelines };
};

describe('DealPipelineIntegrityService on services', () => {
  it('reads the service pipelines and the service table', async () => {
    const { service, query, getPipelines } = buildServiceForServices();

    await service.prepareDealUpdate({
      authContext: AUTH_CONTEXT,
      id: 'service-record',
      data: { stage: 'ONBOARDING_LIVE' },
      objectNameSingular: 'service',
    });

    expect(getPipelines).toHaveBeenCalledWith(
      expect.objectContaining({ objectNameSingular: 'service' }),
    );
    expect(query.mock.calls[0][0]).toContain('."service"');
    expect(query.mock.calls[0][0]).not.toContain('closeDate');
  });

  it('refuses a stage of another pipeline without naming deals', async () => {
    const { service } = buildServiceForServices();

    await expect(
      service.prepareDealUpdate({
        authContext: AUTH_CONTEXT,
        id: 'service-record',
        data: { pipeline: 'ONBOARDING_PIPELINE', stage: 'RENEWALS_OPEN' },
        objectNameSingular: 'service',
      }),
    ).rejects.toMatchObject({
      message: 'Stage Open is not in pipeline Onboarding Pipeline',
      userFriendlyMessage: expect.objectContaining({
        message: expect.stringMatching(/^Stage "/),
      }),
    });
  });

  it('refuses an unknown stage', async () => {
    const { service } = buildServiceForServices();

    await expect(
      service.prepareDealUpdate({
        authContext: AUTH_CONTEXT,
        id: 'service-record',
        data: { stage: 'NOT_A_STAGE' },
        objectNameSingular: 'service',
      }),
    ).rejects.toThrow('Unknown service stage NOT_A_STAGE');
  });

  it('puts a new service in the first pipeline at its first stage', async () => {
    const { service } = buildServiceForServices();

    await expect(
      service.prepareDealsToCreate({
        authContext: AUTH_CONTEXT,
        isUpsert: false,
        records: [{ name: 'Acme onboarding' }],
        objectNameSingular: 'service',
      }),
    ).resolves.toEqual([
      {
        name: 'Acme onboarding',
        pipeline: 'ONBOARDING_PIPELINE',
        stage: 'ONBOARDING_KICK_OFF',
      },
    ]);
  });
});
