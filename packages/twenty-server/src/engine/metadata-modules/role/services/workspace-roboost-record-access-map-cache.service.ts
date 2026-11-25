import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { normalizeRoboostPermissions } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { WorkspaceCacheProvider } from 'src/engine/workspace-cache/interfaces/workspace-cache-provider.service';

import { type RoboostRecordAccessMaps } from 'src/engine/metadata-modules/role/types/roboost-record-access-maps.type';
import { WorkspaceCache } from 'src/engine/workspace-cache/decorators/workspace-cache.decorator';
import { type WorkspaceCacheProviderContext } from 'src/engine/workspace-cache/types/workspace-cache-provider-context.type';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

type UserPermissionRow = {
  workspaceMemberId: string;
  roleId: string;
  permissions: unknown;
};

// Each member's private role id mapped to their saved permissions; read on every ORM query
@Injectable()
@WorkspaceCache('roboostRecordAccessMaps', { packingPonderation: 1 })
export class WorkspaceRoboostRecordAccessMapCacheService extends WorkspaceCacheProvider<RoboostRecordAccessMaps> {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {
    super();
  }

  async computeForCache({
    workspaceId,
  }: WorkspaceCacheProviderContext): Promise<RoboostRecordAccessMaps> {
    const schemaName = getWorkspaceSchemaName(workspaceId);
    const [{ tableName }] = await this.coreDataSource.query(
      `SELECT to_regclass($1)::text AS "tableName"`,
      [`"${schemaName}"."roboostUserPermission"`],
    );

    if (tableName === null) {
      return { subjectByRoleId: {} };
    }

    const rows: UserPermissionRow[] = await this.coreDataSource.query(
      `SELECT "workspaceMemberId", "roleId", permissions FROM "${schemaName}"."roboostUserPermission" WHERE "roleId" IS NOT NULL`,
    );

    return {
      subjectByRoleId: Object.fromEntries(
        rows.map((row) => [
          row.roleId,
          {
            workspaceMemberId: row.workspaceMemberId,
            permissions: normalizeRoboostPermissions(
              row.permissions as Parameters<
                typeof normalizeRoboostPermissions
              >[0],
            ),
          },
        ]),
      ),
    };
  }
}
