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
      return (await this.canMemberRoleReadAllRecords(
        workspaceId,
        workspaceMemberId,
      ))
        ? recordIds
        : [];
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

  // Members without a private role are Admins (full access) or on the default Member role (no access)
  private async canMemberRoleReadAllRecords(
    workspaceId: string,
    workspaceMemberId: string,
  ): Promise<boolean> {
    const rows: { canReadAllObjectRecords: boolean }[] =
      await this.coreDataSource.query(
        `SELECT r."canReadAllObjectRecords" FROM "${getWorkspaceSchemaName(workspaceId)}"."workspaceMember" wm
        JOIN core."userWorkspace" uw ON uw."userId" = wm."userId" AND uw."workspaceId" = $1 AND uw."deletedAt" IS NULL
        JOIN core."roleTarget" rt ON rt."userWorkspaceId" = uw.id
        JOIN core."role" r ON r.id = rt."roleId"
        WHERE wm.id = $2`,
        [workspaceId, workspaceMemberId],
      );

    return rows.some((row) => row.canReadAllObjectRecords === true);
  }

  // Workflow filters run in memory, so a team picked in a member filter is expanded here
  async getTeamMemberIdsByTeamId(
    workspaceId: string,
  ): Promise<Record<string, string[]>> {
    const schemaName = getWorkspaceSchemaName(workspaceId);
    const tables: { exists: boolean }[] = await this.coreDataSource.query(
      `SELECT to_regclass($1) IS NOT NULL AS exists`,
      [`"${schemaName}"."teamMembership"`],
    );

    if (tables[0]?.exists !== true) {
      return {};
    }

    const rows: { teamId: string; workspaceMemberId: string }[] =
      await this.coreDataSource.query(
        `SELECT "teamId", "workspaceMemberId" FROM "${schemaName}"."teamMembership" WHERE "deletedAt" IS NULL`,
      );
    const result: Record<string, string[]> = {};

    for (const row of rows) {
      (result[row.teamId] ??= []).push(row.workspaceMemberId);
    }

    return result;
  }

  // Private Users & Teams roles are managed per member and never offered in role pickers
  async getPrivateRoleIds(workspaceId: string): Promise<Set<string>> {
    const { roboostRecordAccessMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'roboostRecordAccessMaps',
      ]);

    return new Set(Object.keys(roboostRecordAccessMaps.subjectByRoleId));
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
