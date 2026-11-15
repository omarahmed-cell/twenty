import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class OpportunityCollaboratorWorkspaceEntity extends BaseWorkspaceEntity {
  opportunity: EntityRelation<OpportunityWorkspaceEntity>;
  opportunityId: string;
  workspaceMember: EntityRelation<WorkspaceMemberWorkspaceEntity>;
  workspaceMemberId: string;
  position: number;
  searchVector: string;
}
