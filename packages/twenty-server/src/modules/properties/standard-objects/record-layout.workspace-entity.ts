import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class RecordLayoutWorkspaceEntity extends BaseWorkspaceEntity {
  objectMetadataId: string;
  roleId: string | null;
  teamId: string | null;
  layout: Record<string, unknown> | null;
  position: number;
  searchVector: string;
}
