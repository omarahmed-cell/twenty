import { type ActorMetadata, type CurrencyMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type LineItemWorkspaceEntity } from 'src/modules/line-item/standard-objects/line-item.workspace-entity';

export class ProductWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  sku: string | null;
  description: string | null;
  productType: string | null;
  billingFrequency: string | null;
  unitPrice: CurrencyMetadata | null;
  unitCost: CurrencyMetadata | null;
  position: number;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  lineItems: EntityRelation<LineItemWorkspaceEntity[]>;
  searchVector: string;
}
