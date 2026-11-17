import { Module } from '@nestjs/common';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { UserWorkspaceModule } from 'src/engine/core-modules/user-workspace/user-workspace.module';
import { PreCreateWorkspaceMembersCommand } from 'src/modules/workspace-member-pre-create/commands/pre-create-workspace-members.command';

@Module({
  imports: [WorkspaceIteratorModule, UserWorkspaceModule],
  providers: [PreCreateWorkspaceMembersCommand],
})
export class WorkspaceMemberPreCreateModule {}
