import { type ActorMetadata, type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';

export class CallWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  title: string | null;
  bodyV2: RichTextMetadata | null;
  direction: string | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  timelineActivities: EntityRelation<TimelineActivityWorkspaceEntity[]>;
  searchVector: string;
}
