import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class TeamMembershipWorkspaceEntity extends BaseWorkspaceEntity {
  teamId: string;
  workspaceMemberId: string;
  isMain: boolean;
  position: number;
  searchVector: string;
}
