import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';
import { In, IsNull, Not } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';

export type ActivityTargetJunction = {
  junctionObjectName:
    | 'noteTarget'
    | 'taskTarget'
    | 'callTarget'
    | 'communicationTarget';
  activityIdFieldName: 'noteId' | 'taskId' | 'callId' | 'communicationId';
};

type ActivityTargetRecord = {
  id: string;
  targetPersonId: string | null;
  targetCompanyId: string | null;
  targetOpportunityId: string | null;
  targetServiceId: string | null;
} & Partial<
  Record<ActivityTargetJunction['activityIdFieldName'], string | null>
>;

type RecordWithCompany = { id: string; companyId: string | null };

@Injectable()
export class ActivityTargetCompanyCascadeService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async addParentCompanyTargets(
    authContext: WorkspaceAuthContext,
    { junctionObjectName, activityIdFieldName }: ActivityTargetJunction,
    payload: { id: string }[],
  ): Promise<void> {
    if (!payload || payload.length === 0) {
      return;
    }

    assertIsDefinedOrThrow(
      authContext.workspace,
      WorkspaceNotFoundDefaultError,
    );

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const activityTargetRepository =
        this.workspaceOrmManager.getRepository<ActivityTargetRecord>(
          junctionObjectName,
          { shouldBypassPermissionChecks: true },
        );

      const createdTargets = await activityTargetRepository.find({
        where: { id: In(payload.map((target) => target.id)) },
      });

      const [
        companyIdByPersonId,
        companyIdByOpportunityId,
        companyIdByServiceId,
      ] = await Promise.all([
        this.findCompanyIdByRecordId(
          'person',
          createdTargets.map((target) => target.targetPersonId),
        ),
        this.findCompanyIdByRecordId(
          'opportunity',
          createdTargets.map((target) => target.targetOpportunityId),
        ),
        this.findCompanyIdByRecordId(
          'service',
          createdTargets.map((target) => target.targetServiceId),
        ),
      ]);

      const parentCompanyLinks = createdTargets.flatMap((target) => {
        const activityId = target[activityIdFieldName];
        const companyId =
          companyIdByPersonId.get(target.targetPersonId ?? '') ??
          companyIdByOpportunityId.get(target.targetOpportunityId ?? '') ??
          companyIdByServiceId.get(target.targetServiceId ?? '');

        return isDefined(activityId) && isDefined(companyId)
          ? [{ activityId, companyId }]
          : [];
      });

      if (parentCompanyLinks.length === 0) {
        return;
      }

      const existingCompanyTargets = await activityTargetRepository.find({
        where: {
          [activityIdFieldName]: In(
            parentCompanyLinks.map((link) => link.activityId),
          ),
          targetCompanyId: Not(IsNull()),
        },
      });

      const linkedKeys = new Set(
        existingCompanyTargets.map(
          (target) =>
            `${target[activityIdFieldName]}:${target.targetCompanyId}`,
        ),
      );

      const targetsToCreate = parentCompanyLinks.flatMap(
        ({ activityId, companyId }) => {
          const linkKey = `${activityId}:${companyId}`;

          if (linkedKeys.has(linkKey)) {
            return [];
          }

          linkedKeys.add(linkKey);

          return [
            { [activityIdFieldName]: activityId, targetCompanyId: companyId },
          ];
        },
      );

      if (targetsToCreate.length > 0) {
        await activityTargetRepository.insert(targetsToCreate);
      }
    }, authContext);
  }

  private async findCompanyIdByRecordId(
    objectName: 'person' | 'opportunity' | 'service',
    recordIds: (string | null)[],
  ): Promise<Map<string, string>> {
    const definedRecordIds = recordIds.filter(isDefined);

    if (definedRecordIds.length === 0) {
      return new Map();
    }

    const repository =
      this.workspaceOrmManager.getRepository<RecordWithCompany>(objectName, {
        shouldBypassPermissionChecks: true,
      });

    const records = await repository.find({
      select: { id: true, companyId: true },
      where: { id: In(definedRecordIds) },
    });

    return new Map(
      records.flatMap((record) =>
        isDefined(record.companyId)
          ? [[record.id, record.companyId] as const]
          : [],
      ),
    );
  }
}
