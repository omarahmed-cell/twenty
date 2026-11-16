import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type PipelineWorkspaceEntity } from 'src/modules/pipeline/standard-objects/pipeline.workspace-entity';

export class PipelineStageWorkspaceEntity extends BaseWorkspaceEntity {
  pipeline: EntityRelation<PipelineWorkspaceEntity>;
  pipelineId: string;
  label: string;
  value: string;
  color: string | null;
  probability: number | null;
  hubspotStageId: string | null;
  calcPropsEnabled: boolean;
  conditionalRules: object | null;
  position: number;
  searchVector: string;
}
