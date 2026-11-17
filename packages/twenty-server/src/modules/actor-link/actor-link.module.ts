import { Module } from '@nestjs/common';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { LinkMembersCommand } from 'src/modules/actor-link/commands/link-members.command';
import { ActorLinkService } from 'src/modules/actor-link/services/actor-link.service';

@Module({
  imports: [WorkspaceIteratorModule, WorkspaceCacheModule],
  providers: [ActorLinkService, LinkMembersCommand],
})
export class ActorLinkModule {}
