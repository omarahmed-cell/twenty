import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class PropertyLogicRuleWorkspaceEntity extends BaseWorkspaceEntity {
  objectMetadataId: string;
  conditionGroups: unknown;
  properties: unknown;
  createdBy: ActorMetadata;
  position: number;
  searchVector: string;
}
