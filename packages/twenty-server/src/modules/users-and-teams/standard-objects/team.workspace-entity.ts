import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class TeamWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  position: number;
  searchVector: string;
}
