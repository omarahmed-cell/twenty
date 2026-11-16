import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type PipelineStageWorkspaceEntity } from 'src/modules/pipeline/standard-objects/pipeline-stage.workspace-entity';

export class PipelineWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  description: string | null;
  key: string;
  objectNameSingular: string;
  hubspotPipelineId: string | null;
  rules: object | null;
  position: number;
  stages: EntityRelation<PipelineStageWorkspaceEntity[]>;
  searchVector: string;
}
