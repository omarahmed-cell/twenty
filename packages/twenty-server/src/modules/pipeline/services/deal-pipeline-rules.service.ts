import { Injectable, Logger } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { PipelineAccessService } from 'src/modules/pipeline/services/pipeline-access.service';
import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';
import {
  type DealRuleActorKind,
  type DealRuleViolation,
  describeDealRuleOverride,
  evaluateDealPipelineRules,
} from 'src/modules/pipeline/utils/evaluate-deal-pipeline-rules.util';
import { toResolvedTimelineActivityType } from 'src/modules/timeline/utils/resolve-timeline-activity-type.util';
import { isWorkflowRecordWrite } from 'src/modules/workflow/workflow-executor/workflow-actions/record-crud/utils/workflow-record-write-context.storage';

export type DealRuleActor = {
  kind: DealRuleActorKind;
  name: string;
  workspaceMemberId: string | null;
};

type DealValues = {
  pipeline: string | null;
  stage: string | null;
  closeDate?: string | Date | null;
};

// The standard "updated" entry, so the override shows like any other change on the deal
const RECORD_UPDATED_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIER =
  '20202020-0d1a-4f0e-8a55-1c0a2f0a2c02';

const IGNORED_FIELD_NAMES = new Set([
  'id',
  'createdBy',
  'updatedBy',
  'updatedAt',
  'createdAt',
  'position',
]);

const toRefusal = (violation: DealRuleViolation) => {
  switch (violation.kind) {
    case 'STAGE_MOVE': {
      const { refusal } = violation;

      switch (refusal.reason) {
        case 'SKIP': {
          const { fromLabel, toLabel } = refusal;
          const nextAllowedLabel = refusal.nextAllowedLabel ?? '';
          const message = `Can't skip from ${fromLabel} to ${toLabel}. Next allowed: ${nextAllowedLabel}, or a lost stage.`;

          return {
            message,
            userFriendlyMessage: msg`Can't skip from ${fromLabel} to ${toLabel}. Next allowed: ${nextAllowedLabel}, or a lost stage.`,
          };
        }
        case 'BACKWARD': {
          const { fromLabel, toLabel } = refusal;

          return {
            message: `Can't move a deal backward from ${fromLabel} to ${toLabel}. Only Super Admins can.`,
            userFriendlyMessage: msg`Can't move a deal backward from ${fromLabel} to ${toLabel}. Only Super Admins can.`,
          };
        }
        case 'OUT_OF_CLOSED_STAGE': {
          const { fromLabel, toLabel } = refusal;

          return {
            message: `Deals in ${fromLabel} can't move to ${toLabel}. Only Super Admins can.`,
            userFriendlyMessage: msg`Deals in ${fromLabel} can't move to ${toLabel}. Only Super Admins can.`,
          };
        }
      }
    }
    case 'CREATION_STAGE': {
      const { pipelineName, stageLabel } = violation;
      const allowedLabels = violation.allowedLabels.join(', ');

      return {
        message: `New deals in ${pipelineName} can't start in ${stageLabel}. Allowed: ${allowedLabels}.`,
        userFriendlyMessage: msg`New deals in ${pipelineName} can't start in ${stageLabel}. Allowed: ${allowedLabels}.`,
      };
    }
    case 'PIPELINE_CHANGE': {
      const { pipelineName, stageLabel } = violation;

      return {
        message: `Only Super Admins can move a deal into the ${pipelineName} pipeline at ${stageLabel}.`,
        userFriendlyMessage: msg`Only Super Admins can move a deal into the ${pipelineName} pipeline at ${stageLabel}.`,
      };
    }
    case 'LOCKED': {
      const { stageLabel } = violation;

      return {
        message: `Deals in ${stageLabel} can only be edited by Super Admins.`,
        userFriendlyMessage: msg`Deals in ${stageLabel} can only be edited by Super Admins.`,
      };
    }
    case 'CLOSE_DATE':
      return {
        message: 'Only Super Admins can change Close Date.',
        userFriendlyMessage: msg`Only Super Admins can change Close Date.`,
      };
  }
};

const buildActorName = (authContext: WorkspaceAuthContext) => {
  if (authContext.type === 'user') {
    const { firstName, lastName } = authContext.workspaceMember.name ?? {};
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    return fullName.length > 0 ? fullName : authContext.user.email;
  }

  if (authContext.type === 'apiKey') {
    return authContext.apiKey.name;
  }

  return 'Twenty';
};

// The pipeline rules a non-Admin must follow on every deal write the query runners handle
@Injectable()
export class DealPipelineRulesService {
  private readonly logger = new Logger(DealPipelineRulesService.name);

  constructor(
    private readonly pipelineAccessService: PipelineAccessService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  ) {}

  async resolveActor(
    authContext: WorkspaceAuthContext,
  ): Promise<DealRuleActor> {
    const workspaceMemberId =
      authContext.type === 'user' ? authContext.workspaceMemberId : null;

    if (authContext.type === 'system') {
      return { kind: 'SYSTEM', name: 'Twenty', workspaceMemberId };
    }

    if (isWorkflowRecordWrite()) {
      return { kind: 'WORKFLOW', name: 'Workflow', workspaceMemberId };
    }

    const isAdmin =
      await this.pipelineAccessService.canEditPipelines(authContext);

    return {
      kind: isAdmin ? 'ADMIN' : 'MEMBER',
      name: buildActorName(authContext),
      workspaceMemberId,
    };
  }

  async enforce({
    workspaceId,
    actor,
    isImport = false,
    operation,
    pipelines,
    recordId,
    current,
    next,
    data,
  }: {
    workspaceId: string;
    actor: DealRuleActor;
    isImport?: boolean;
    operation: 'create' | 'update' | 'delete';
    pipelines: PipelineConfig[];
    recordId: string | undefined;
    current?: DealValues;
    next?: DealValues;
    data?: Record<string, unknown>;
  }): Promise<void> {
    const evaluation = evaluateDealPipelineRules({
      operation,
      actorKind: isImport ? 'IMPORT' : actor.kind,
      pipelines,
      current,
      next,
      changedFieldNames: Object.keys(data ?? {}).filter(
        (fieldName) => !IGNORED_FIELD_NAMES.has(fieldName),
      ),
    });

    if (evaluation.status === 'refused') {
      const { message, userFriendlyMessage } = toRefusal(evaluation.violation);

      throw new CommonQueryRunnerException(
        message,
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        { userFriendlyMessage },
      );
    }

    if (evaluation.status === 'overridden' && isDefined(recordId)) {
      await this.recordOverrides({
        workspaceId,
        recordId,
        actor,
        violations: evaluation.violations,
      });
    }
  }

  private async recordOverrides({
    workspaceId,
    recordId,
    actor,
    violations,
  }: {
    workspaceId: string;
    recordId: string;
    actor: DealRuleActor;
    violations: DealRuleViolation[];
  }) {
    const happensAt = new Date().toISOString();

    try {
      const { flatTimelineActivityTypeMaps } =
        await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
          { workspaceId, flatMapsKeys: ['flatTimelineActivityTypeMaps'] },
        );
      const recordUpdatedType = findFlatEntityByUniversalIdentifier({
        flatEntityMaps: flatTimelineActivityTypeMaps,
        universalIdentifier:
          RECORD_UPDATED_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIER,
      });
      const resolvedType = isDefined(recordUpdatedType)
        ? toResolvedTimelineActivityType(recordUpdatedType)
        : undefined;

      await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
        const timelineActivityRepository =
          this.workspaceOrmManager.getRepository('timelineActivity', {
            shouldBypassPermissionChecks: true,
          });

        await timelineActivityRepository.insert(
          violations.map((violation) => ({
            happensAt,
            timelineActivityTypeId: resolvedType?.id ?? null,
            timelineActivityTypeSnapshot: resolvedType?.snapshot ?? null,
            workspaceMemberId: actor.workspaceMemberId,
            targetOpportunityId: recordId,
            properties: {
              pipelineRuleOverride: describeDealRuleOverride({
                violation,
                actorName: actor.name,
              }),
            },
          })),
        );
      }, buildSystemAuthContext(workspaceId));
    } catch (error) {
      // The write the Admin asked for still goes through; only its trace is lost
      this.logger.error(
        `Could not record a pipeline rule override on deal ${recordId}: ${error}`,
      );
    }
  }
}
