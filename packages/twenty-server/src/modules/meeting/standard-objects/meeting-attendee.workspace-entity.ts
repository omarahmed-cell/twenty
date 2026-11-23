import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type MeetingWorkspaceEntity } from 'src/modules/meeting/standard-objects/meeting.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class MeetingAttendeeWorkspaceEntity extends BaseWorkspaceEntity {
  meeting: EntityRelation<MeetingWorkspaceEntity> | null;
  meetingId: string | null;
  email: string | null;
  displayName: string | null;
  person: EntityRelation<PersonWorkspaceEntity> | null;
  personId: string | null;
  workspaceMember: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  workspaceMemberId: string | null;
  responseStatus: string | null;
  isOrganizer: boolean | null;
}
