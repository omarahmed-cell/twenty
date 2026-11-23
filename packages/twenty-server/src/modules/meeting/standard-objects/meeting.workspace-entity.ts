import {
  type ActorMetadata,
  type LinksMetadata,
  type RichTextMetadata,
} from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AttachmentWorkspaceEntity } from 'src/modules/attachment/standard-objects/attachment.workspace-entity';
import { type MeetingAttendeeWorkspaceEntity } from 'src/modules/meeting/standard-objects/meeting-attendee.workspace-entity';
import { type MeetingTargetWorkspaceEntity } from 'src/modules/meeting/standard-objects/meeting-target.workspace-entity';
import { type TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class MeetingWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  title: string | null;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string | null;
  host: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  hostId: string | null;
  assignedTo: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  assignedToId: string | null;
  meetingType: string | null;
  meetingOutcome: string | null;
  locationType: string | null;
  location: string | null;
  meetLink: LinksMetadata | null;
  attendeeDescription: RichTextMetadata | null;
  internalNote: RichTextMetadata | null;
  googleEventId: string | null;
  googleCalendarId: string | null;
  googleICalUid: string | null;
  source: string | null;
  recordingUrl: LinksMetadata | null;
  recordingDriveFileId: string | null;
  geminiNotesUrl: LinksMetadata | null;
  aiSummary: RichTextMetadata | null;
  transcriptDocUrl: LinksMetadata | null;
  transcript: string | null;
  transcriptStatus: string | null;
  artifactsCheckedAt: string | null;
  hubspotId: string | null;
  hubspotHasTranscript: boolean | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  meetingAttendees: EntityRelation<MeetingAttendeeWorkspaceEntity[]>;
  meetingTargets: EntityRelation<MeetingTargetWorkspaceEntity[]>;
  attachments: EntityRelation<AttachmentWorkspaceEntity[]>;
  timelineActivities: EntityRelation<TimelineActivityWorkspaceEntity[]>;
  searchVector: string;
}
