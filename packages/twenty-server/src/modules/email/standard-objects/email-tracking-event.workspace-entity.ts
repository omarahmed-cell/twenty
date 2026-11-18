import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type EmailWorkspaceEntity } from 'src/modules/email/standard-objects/email.workspace-entity';

export class EmailTrackingEventWorkspaceEntity extends BaseWorkspaceEntity {
  email: EntityRelation<EmailWorkspaceEntity>;
  emailId: string;
  type: string;
  url: string | null;
  occurredAt: string;
  userAgent: string | null;
  isProxy: boolean;
  isSender: boolean;
  isCounted: boolean;
  position: number;
  searchVector: string;
}
