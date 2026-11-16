import { DEFAULT_PIPELINE_RULES } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { type WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { DealPipelineRulesService } from 'src/modules/pipeline/services/deal-pipeline-rules.service';
import { type PipelineAccessService } from 'src/modules/pipeline/services/pipeline-access.service';
import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';
import { runAsWorkflowRecordWrite } from 'src/modules/workflow/workflow-executor/workflow-actions/record-crud/utils/workflow-record-write-context.storage';

const USER_AUTH_CONTEXT = {
  type: 'user',
  workspace: { id: 'workspace-id' },
  workspaceMemberId: 'member-id',
  workspaceMember: { name: { firstName: 'Omar', lastName: 'Ahmed' } },
  user: { email: 'omar@example.com' },
} as unknown as WorkspaceAuthContext;

const SALES: PipelineConfig = {
  id: 'sales',
  key: 'SALES_PIPELINE',
  name: 'Sales Pipeline',
  description: null,
  position: 0,
  objectNameSingular: 'opportunity',
  hubspotPipelineId: null,
  rules: { ...DEFAULT_PIPELINE_RULES, restrictBackward: true },
  stages: [
    { value: 'A', label: '1. Discovery Stage', position: 0, probability: 10 },
    { value: 'B', label: '2. Qualified to buy', position: 1, probability: 20 },
  ].map((stage) => ({
    ...stage,
    id: stage.value,
    pipelineId: 'sales',
    color: null,
    hubspotStageId: null,
    calcPropsEnabled: false,
    conditionalRules: [],
  })),
};

const buildService = (isAdmin: boolean) => {
  const insert = jest.fn();

  return {
    insert,
    service: new DealPipelineRulesService(
      {
        canEditPipelines: jest.fn().mockResolvedValue(isAdmin),
      } as unknown as PipelineAccessService,
      {
        executeInWorkspaceContext: async (fn: () => Promise<void>) => fn(),
        getRepository: () => ({ insert }),
      } as unknown as WorkspaceOrmManager,
      {
        getOrRecomputeManyOrAllFlatEntityMaps: jest.fn().mockResolvedValue({
          flatTimelineActivityTypeMaps: {
            byUniversalIdentifier: {},
            universalIdentifierById: {},
            universalIdentifiersByApplicationId: {},
          },
        }),
      } as unknown as WorkspaceManyOrAllFlatEntityMapsCacheService,
    ),
  };
};

const moveBackward = {
  workspaceId: 'workspace-id',
  operation: 'update' as const,
  pipelines: [SALES],
  recordId: 'deal-id',
  current: { pipeline: 'SALES_PIPELINE', stage: 'B' },
  next: { pipeline: 'SALES_PIPELINE', stage: 'A' },
  data: { stage: 'A' },
};

describe('DealPipelineRulesService', () => {
  it('tells workflows, Admins and members apart', async () => {
    const { service: adminService } = buildService(true);
    const { service: memberService } = buildService(false);

    expect((await adminService.resolveActor(USER_AUTH_CONTEXT)).kind).toBe(
      'ADMIN',
    );
    expect((await memberService.resolveActor(USER_AUTH_CONTEXT)).kind).toBe(
      'MEMBER',
    );
    expect(
      (
        await runAsWorkflowRecordWrite(() =>
          memberService.resolveActor(USER_AUTH_CONTEXT),
        )
      ).kind,
    ).toBe('WORKFLOW');
  });

  it('refuses a member and explains why', async () => {
    const { service } = buildService(false);
    const actor = await service.resolveActor(USER_AUTH_CONTEXT);

    await expect(service.enforce({ ...moveBackward, actor })).rejects.toThrow(
      "Can't move a deal backward from 2. Qualified to buy to 1. Discovery Stage. Only Super Admins can.",
    );
  });

  it('lets an Admin through and writes the override on the deal timeline', async () => {
    const { service, insert } = buildService(true);
    const actor = await service.resolveActor(USER_AUTH_CONTEXT);

    await service.enforce({ ...moveBackward, actor });

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        targetOpportunityId: 'deal-id',
        workspaceMemberId: 'member-id',
        properties: {
          pipelineRuleOverride:
            'Moved backward from 2. Qualified to buy to 1. Discovery Stage by Omar Ahmed (Super Admin override)',
        },
      }),
    ]);
  });

  it('lets an import through without a trace', async () => {
    const { service, insert } = buildService(false);
    const actor = await service.resolveActor(USER_AUTH_CONTEXT);

    await service.enforce({ ...moveBackward, actor, isImport: true });

    expect(insert).not.toHaveBeenCalled();
  });
});
