import { type ActorMetadata, type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AttachmentWorkspaceEntity } from 'src/modules/attachment/standard-objects/attachment.workspace-entity';
import { type EmailTrackingEventWorkspaceEntity } from 'src/modules/email/standard-objects/email-tracking-event.workspace-entity';
import { type EmailTargetWorkspaceEntity } from 'src/modules/email/standard-objects/email-target.workspace-entity';
import { type TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

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
  cc: string | null;
  bcc: string | null;
  bodyPreview: string | null;
  source: string | null;
  gmailMessageId: string | null;
  gmailThreadId: string | null;
  rfcMessageId: string | null;
  inReplyTo: string | null;
  trackEnabled: boolean | null;
  openCount: number | null;
  clickCount: number | null;
  replyCount: number | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  lastClickedAt: string | null;
  repliedAt: string | null;
  deliveryError: string | null;
  loggedBy: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  loggedById: string | null;
  trackingEvents: EntityRelation<EmailTrackingEventWorkspaceEntity[]>;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  assignedTo: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  assignedToId: string | null;
  emailTargets: EntityRelation<EmailTargetWorkspaceEntity[]>;
  attachments: EntityRelation<AttachmentWorkspaceEntity[]>;
  timelineActivities: EntityRelation<TimelineActivityWorkspaceEntity[]>;
  searchVector: string;
}
