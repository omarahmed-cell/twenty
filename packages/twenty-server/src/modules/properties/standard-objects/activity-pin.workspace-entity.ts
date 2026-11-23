import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class ActivityPinWorkspaceEntity extends BaseWorkspaceEntity {
  targetObjectNameSingular: string;
  targetRecordId: string;
  activityObjectNameSingular: string;
  activityRecordId: string;
  position: number;
  searchVector: string;
}
