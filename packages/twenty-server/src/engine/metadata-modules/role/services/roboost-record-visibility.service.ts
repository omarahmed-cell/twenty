import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { type RoboostRecordAccessSubject } from 'src/engine/metadata-modules/role/types/roboost-record-access-maps.type';
import { type OperationType } from 'src/engine/twenty-orm/repository/permissions.utils';
import {
  buildRoboostMergeCondition,
  buildRoboostRecordAccessCondition,
} from 'src/engine/twenty-orm/utils/build-roboost-record-access-condition.util';
import { compileNamedParameters } from 'src/engine/twenty-orm/sql/utils/compile-named-parameters.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// The ORM applies per-user record access on every query; this applies the same rule
// to paths that read with a system context or raw SQL (notifications, Gmail extension, timelines)
@Injectable()
export class RoboostRecordVisibilityService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  async getSubjectForMember(
    workspaceId: string,
    workspaceMemberId: string,
  ): Promise<RoboostRecordAccessSubject | null> {
    const { roboostRecordAccessMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'roboostRecordAccessMaps',
      ]);
    const rows: { roleId: string }[] = await this.coreDataSource.query(
      `SELECT rt."roleId" FROM "${getWorkspaceSchemaName(workspaceId)}"."workspaceMember" wm
      JOIN core."userWorkspace" uw ON uw."userId" = wm."userId" AND uw."workspaceId" = $1 AND uw."deletedAt" IS NULL
      JOIN core."roleTarget" rt ON rt."userWorkspaceId" = uw.id
      WHERE wm.id = $2`,
      [workspaceId, workspaceMemberId],
    );

    return (
      rows
        .map((row) => roboostRecordAccessMaps.subjectByRoleId[row.roleId])
        .find(isDefined) ?? null
    );
  }

  async filterVisibleRecordIds({
    workspaceId,
    workspaceMemberId,
    objectNameSingular,
    recordIds,
    operationType = 'select',
    isMerge = false,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
    objectNameSingular: string;
    recordIds: string[];
    operationType?: OperationType;
    isMerge?: boolean;
  }): Promise<string[]> {
    if (recordIds.length === 0) {
      return [];
    }

    const subject = await this.getSubjectForMember(
      workspaceId,
      workspaceMemberId,
    );

    if (!isDefined(subject)) {
      return recordIds;
    }

    const schemaName = getWorkspaceSchemaName(workspaceId);
    const condition = isMerge
      ? buildRoboostMergeCondition({
          subject,
          objectNameSingular,
          alias: 'rbv',
          schemaName,
        })
      : buildRoboostRecordAccessCondition({
          subject,
          objectNameSingular,
          operationType,
          alias: 'rbv',
          schemaName,
        });

    if (condition.kind === 'open') {
      return recordIds;
    }

    if (condition.kind === 'denied') {
      return [];
    }

    const { text, values } = compileNamedParameters(
      `SELECT "rbv"."id" FROM "${schemaName}"."${objectNameSingular}" "rbv" WHERE CAST("rbv"."id" AS text) = ANY(CAST(:roboostVisibilityIds AS text[])) AND (${condition.sql})`,
      { ...condition.parameters, roboostVisibilityIds: recordIds },
    );
    const rows: { id: string }[] = await this.coreDataSource.query(
      text,
      values,
    );

    return rows.map((row) => row.id);
  }

  async canViewRecord(args: {
    workspaceId: string;
    workspaceMemberId: string;
    objectNameSingular: string;
    recordId: string;
  }): Promise<boolean> {
    const visibleIds = await this.filterVisibleRecordIds({
      ...args,
      recordIds: [args.recordId],
    });

    return visibleIds.length > 0;
  }

  async hasToggle(
    workspaceId: string,
    workspaceMemberId: string,
    toggleKey: string,
  ): Promise<boolean> {
    const subject = await this.getSubjectForMember(
      workspaceId,
      workspaceMemberId,
    );

    return (
      !isDefined(subject) || subject.permissions.toggles[toggleKey] === true
    );
  }
}
