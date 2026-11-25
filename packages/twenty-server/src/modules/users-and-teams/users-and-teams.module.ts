import { Module } from '@nestjs/common';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { UserWorkspaceModule } from 'src/engine/core-modules/user-workspace/user-workspace.module';
import { WorkspaceInvitationModule } from 'src/engine/core-modules/workspace-invitation/workspace-invitation.module';
import { ObjectPermissionModule } from 'src/engine/metadata-modules/object-permission/object-permission.module';
import { RolePermissionFlagModule } from 'src/engine/metadata-modules/role-permission-flag/role-permission-flag.module';
import { RoleModule } from 'src/engine/metadata-modules/role/role.module';
import { UserRoleModule } from 'src/engine/metadata-modules/user-role/user-role.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { RoboostRecordVisibilityModule } from 'src/engine/metadata-modules/role/roboost-record-visibility.module';
import {
  ROBOOST_ACCESS_QUERY_HOOKS,
  RoboostAccessHookService,
} from 'src/modules/users-and-teams/query-hooks/roboost-access.pre-query.hooks';
import { RoboostUsersSyncCommand } from 'src/modules/users-and-teams/commands/roboost-users-sync.command';
import { RoboostUsersResolver } from 'src/modules/users-and-teams/resolvers/roboost-users.resolver';
import { RoboostRoleSyncService } from 'src/modules/users-and-teams/services/roboost-role-sync.service';
import { RoboostUserPermissionStoreService } from 'src/modules/users-and-teams/services/roboost-user-permission-store.service';
import { RoboostUsersService } from 'src/modules/users-and-teams/services/roboost-users.service';

@Module({
  imports: [
    ApplicationModule,
    RoleModule,
    ObjectPermissionModule,
    RolePermissionFlagModule,
    UserRoleModule,
    UserWorkspaceModule,
    WorkspaceInvitationModule,
    WorkspaceCacheModule,
    WorkspaceIteratorModule,
    RoboostRecordVisibilityModule,
  ],
  providers: [
    RoboostUserPermissionStoreService,
    RoboostRoleSyncService,
    RoboostUsersService,
    RoboostUsersResolver,
    RoboostUsersSyncCommand,
    RoboostAccessHookService,
    ...ROBOOST_ACCESS_QUERY_HOOKS,
  ],
  exports: [RoboostUsersService, RoboostUserPermissionStoreService],
})
export class UsersAndTeamsModule {}
