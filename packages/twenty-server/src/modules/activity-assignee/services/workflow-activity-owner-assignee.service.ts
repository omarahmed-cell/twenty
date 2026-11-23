import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';
import { IsNull } from 'typeorm';

import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

const ASSIGNEE_COLUMN_BY_ACTIVITY_OBJECT: Record<string, string> = {
  task: 'assigneeId',
  note: 'assignedToId',
  call: 'assignedToId',
  communication: 'assignedToId',
  email: 'assignedToId',
  calendarEvent: 'assignedToId',
};

const OWNER_COLUMNS = [
  'accountOwnerId',
  'ownerId',
  'assigneeId',
  'sdrOwnerId',
  'assignedToId',
];

type JunctionRow = Record<string, unknown> & { id: string };

export const getActivityObjectOfJunction = (junctionObjectName: string) => {
  const activityObjectName = junctionObjectName.replace(/Target$/, '');

  return junctionObjectName.endsWith('Target') &&
    isDefined(ASSIGNEE_COLUMN_BY_ACTIVITY_OBJECT[activityObjectName])
    ? activityObjectName
    : undefined;
};

// Workflows without a chosen assignee hand the activity to the owner of the record it is linked to
@Injectable()
export class WorkflowActivityOwnerAssigneeService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async assignFromLinkedRecordOwner({
    workspaceId,
    junctionObjectName,
    junctionIds,
  }: {
    workspaceId: string;
    junctionObjectName: string;
    junctionIds: string[];
  }) {
    const activityObjectName = getActivityObjectOfJunction(junctionObjectName);

    if (!isDefined(activityObjectName) || junctionIds.length === 0) {
      return;
    }

    const assigneeColumn =
      ASSIGNEE_COLUMN_BY_ACTIVITY_OBJECT[activityObjectName];

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const junctionRepository = this.workspaceOrmManager.getRepository(
        junctionObjectName,
        { shouldBypassPermissionChecks: true },
      );
      const activityRepository = this.workspaceOrmManager.getRepository(
        activityObjectName,
        { shouldBypassPermissionChecks: true },
      );

      for (const junctionId of junctionIds) {
        const junction = (await junctionRepository.findOne({
          where: { id: junctionId },
        })) as JunctionRow | null;
        const activityId = junction?.[`${activityObjectName}Id`];

        if (!isDefined(junction) || typeof activityId !== 'string') {
          continue;
        }

        const activity = (await activityRepository.findOne({
          where: { id: activityId },
        })) as Record<string, unknown> | null;
        const createdBy = activity?.createdBy as { source?: string } | null;

        if (
          !isDefined(activity) ||
          isDefined(activity[assigneeColumn]) ||
          createdBy?.source !== 'WORKFLOW'
        ) {
          continue;
        }

        const ownerId = await this.findLinkedRecordOwnerId(junction);

        if (!isDefined(ownerId)) {
          continue;
        }

        await activityRepository.update(
          { id: activityId, [assigneeColumn]: IsNull() },
          { [assigneeColumn]: ownerId },
        );
      }
    }, buildSystemAuthContext(workspaceId));
  }

  private async findLinkedRecordOwnerId(junction: JunctionRow) {
    for (const [column, value] of Object.entries(junction)) {
      const match = /^target([A-Z]\w*)Id$/.exec(column);

      if (match === null || typeof value !== 'string') {
        continue;
      }

      const targetObjectName = `${match[1].charAt(0).toLowerCase()}${match[1].slice(1)}`;

      try {
        const target = (await this.workspaceOrmManager
          .getRepository(targetObjectName, {
            shouldBypassPermissionChecks: true,
          })
          .findOne({ where: { id: value } })) as Record<string, unknown> | null;

        const ownerId = OWNER_COLUMNS.map(
          (ownerColumn) => target?.[ownerColumn],
        ).find((candidate) => typeof candidate === 'string');

        if (typeof ownerId === 'string') {
          return ownerId;
        }
      } catch {
        continue;
      }
    }

    return undefined;
  }
}
