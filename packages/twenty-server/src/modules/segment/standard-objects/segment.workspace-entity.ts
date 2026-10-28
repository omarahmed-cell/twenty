import {
  type ActorMetadata,
  type SegmentTargetObject,
} from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type SegmentMemberWorkspaceEntity } from 'src/modules/segment/standard-objects/segment-member.workspace-entity';

export class SegmentWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  targetObject: SegmentTargetObject | null;
  memberCount: number;
  position: number;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  segmentMembers: EntityRelation<SegmentMemberWorkspaceEntity[]>;
  searchVector: string;
}
