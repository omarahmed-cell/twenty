import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';

export class ServiceWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  position: number;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  company: EntityRelation<CompanyWorkspaceEntity> | null;
  companyId: string | null;
  pointOfContact: EntityRelation<PersonWorkspaceEntity> | null;
  pointOfContactId: string | null;
  opportunity: EntityRelation<OpportunityWorkspaceEntity> | null;
  opportunityId: string | null;
  timelineActivities: EntityRelation<TimelineActivityWorkspaceEntity[]>;
  searchVector: string;
}
