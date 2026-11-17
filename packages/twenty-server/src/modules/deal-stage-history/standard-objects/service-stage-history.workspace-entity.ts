import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type ServiceWorkspaceEntity } from 'src/modules/service/standard-objects/service.workspace-entity';

export class ServiceStageHistoryWorkspaceEntity extends BaseWorkspaceEntity {
  service: EntityRelation<ServiceWorkspaceEntity>;
  serviceId: string;
  pipeline: string | null;
  fromStage: string | null;
  toStage: string | null;
  changedAt: string;
  changedBy: ActorMetadata;
  position: number;
  searchVector: string;
}
