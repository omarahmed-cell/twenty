import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class PropertyGroupMembershipWorkspaceEntity extends BaseWorkspaceEntity {
  propertyGroupId: string;
  fieldMetadataId: string;
  objectMetadataId: string;
  position: number;
  searchVector: string;
}
