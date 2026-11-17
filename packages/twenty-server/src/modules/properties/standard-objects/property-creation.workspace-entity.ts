import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class PropertyCreationWorkspaceEntity extends BaseWorkspaceEntity {
  fieldMetadataId: string;
  objectMetadataId: string;
  createdBy: ActorMetadata;
  position: number;
  searchVector: string;
}
