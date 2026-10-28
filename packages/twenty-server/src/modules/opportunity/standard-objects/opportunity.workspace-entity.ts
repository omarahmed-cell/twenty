import { type ActorMetadata, type CurrencyMetadata } from 'twenty-shared/types';

import { type AgentChatThreadTargetWorkspaceEntity } from 'src/engine/metadata-modules/ai/ai-history/standard-objects/agent-chat-thread-target.workspace-entity';
import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AttachmentWorkspaceEntity } from 'src/modules/attachment/standard-objects/attachment.workspace-entity';
import { type CallTargetWorkspaceEntity } from 'src/modules/call/standard-objects/call-target.workspace-entity';
import { type SegmentMemberWorkspaceEntity } from 'src/modules/segment/standard-objects/segment-member.workspace-entity';
import { type CommunicationTargetWorkspaceEntity } from 'src/modules/communication/standard-objects/communication-target.workspace-entity';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type LineItemWorkspaceEntity } from 'src/modules/line-item/standard-objects/line-item.workspace-entity';
import { type NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { type CalendarEventTargetWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event-target.workspace-entity';
import { type MessageThreadTargetWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-thread-target.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type ServiceWorkspaceEntity } from 'src/modules/service/standard-objects/service.workspace-entity';
import { type TaskTargetWorkspaceEntity } from 'src/modules/task/standard-objects/task-target.workspace-entity';
import { type TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class OpportunityWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  amount: CurrencyMetadata | null;
  closeDate: Date | null;
  stage: string;
  position: number;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  pointOfContact: EntityRelation<PersonWorkspaceEntity> | null;
  pointOfContactId: string | null;
  company: EntityRelation<CompanyWorkspaceEntity> | null;
  companyId: string | null;
  taskTargets: EntityRelation<TaskTargetWorkspaceEntity[]>;
  noteTargets: EntityRelation<NoteTargetWorkspaceEntity[]>;
  callTargets: EntityRelation<CallTargetWorkspaceEntity[]>;
  segmentMembers: EntityRelation<SegmentMemberWorkspaceEntity[]>;
  segmentMembership: string[] | null;
  communicationTargets: EntityRelation<CommunicationTargetWorkspaceEntity[]>;
  agentChatThreadTargets: EntityRelation<
    AgentChatThreadTargetWorkspaceEntity[]
  >;
  calendarEventTargets: EntityRelation<CalendarEventTargetWorkspaceEntity[]>;
  messageThreadTargets: EntityRelation<MessageThreadTargetWorkspaceEntity[]>;
  attachments: EntityRelation<AttachmentWorkspaceEntity[]>;
  timelineActivities: EntityRelation<TimelineActivityWorkspaceEntity[]>;
  owner: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  ownerId: string | null;
  services: EntityRelation<ServiceWorkspaceEntity[]>;
  lineItems: EntityRelation<LineItemWorkspaceEntity[]>;
  /** @deprecated */
  probability: string;
  searchVector: string;
}
