import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class PropertyGroupWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  objectMetadataId: string;
  position: number;
  searchVector: string;
}
