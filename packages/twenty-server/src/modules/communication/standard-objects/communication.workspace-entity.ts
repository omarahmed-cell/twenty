import { type ActorMetadata, type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AttachmentWorkspaceEntity } from 'src/modules/attachment/standard-objects/attachment.workspace-entity';
import { type CommunicationTargetWorkspaceEntity } from 'src/modules/communication/standard-objects/communication-target.workspace-entity';
import { type TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';

export class CommunicationWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  title: string | null;
  bodyV2: RichTextMetadata | null;
  direction: string | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  communicationTargets: EntityRelation<CommunicationTargetWorkspaceEntity[]>;
  attachments: EntityRelation<AttachmentWorkspaceEntity[]>;
  timelineActivities: EntityRelation<TimelineActivityWorkspaceEntity[]>;
  searchVector: string;
}
