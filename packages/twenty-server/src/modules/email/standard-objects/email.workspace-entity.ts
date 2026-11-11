import { type ActorMetadata, type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AttachmentWorkspaceEntity } from 'src/modules/attachment/standard-objects/attachment.workspace-entity';
import { type EmailTargetWorkspaceEntity } from 'src/modules/email/standard-objects/email-target.workspace-entity';
import { type TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';

export class EmailWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  subject: string | null;
  bodyV2: RichTextMetadata | null;
  direction: string | null;
  from: string | null;
  to: string | null;
  sentAt: string | null;
  status: string | null;
  hubspotId: string | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  emailTargets: EntityRelation<EmailTargetWorkspaceEntity[]>;
  attachments: EntityRelation<AttachmentWorkspaceEntity[]>;
  timelineActivities: EntityRelation<TimelineActivityWorkspaceEntity[]>;
  searchVector: string;
}
