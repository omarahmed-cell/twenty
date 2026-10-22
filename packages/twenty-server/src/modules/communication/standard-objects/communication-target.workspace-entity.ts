import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type CommunicationWorkspaceEntity } from 'src/modules/communication/standard-objects/communication.workspace-entity';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type ServiceWorkspaceEntity } from 'src/modules/service/standard-objects/service.workspace-entity';

export class CommunicationTargetWorkspaceEntity extends BaseWorkspaceEntity {
  communication: EntityRelation<CommunicationWorkspaceEntity> | null;
  communicationId: string | null;
  targetPerson: EntityRelation<PersonWorkspaceEntity> | null;
  targetPersonId: string | null;
  targetCompany: EntityRelation<CompanyWorkspaceEntity> | null;
  targetCompanyId: string | null;
  targetOpportunity: EntityRelation<OpportunityWorkspaceEntity> | null;
  targetOpportunityId: string | null;
  targetService: EntityRelation<ServiceWorkspaceEntity> | null;
  targetServiceId: string | null;
}
