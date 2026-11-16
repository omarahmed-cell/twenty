import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';

export class OpportunityStageHistoryWorkspaceEntity extends BaseWorkspaceEntity {
  opportunity: EntityRelation<OpportunityWorkspaceEntity>;
  opportunityId: string;
  pipeline: string | null;
  fromStage: string | null;
  toStage: string | null;
  changedAt: string;
  changedBy: ActorMetadata;
  position: number;
  searchVector: string;
}
