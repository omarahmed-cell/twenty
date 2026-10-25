import { type ActorMetadata, type CurrencyMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type ProductWorkspaceEntity } from 'src/modules/product/standard-objects/product.workspace-entity';

export class LineItemWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  term: number | null;
  billingFrequency: string | null;
  quantity: number | null;
  unitPrice: CurrencyMetadata | null;
  unitDiscount: number | null;
  totalPrice: CurrencyMetadata | null;
  position: number;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  product: EntityRelation<ProductWorkspaceEntity> | null;
  productId: string | null;
  deal: EntityRelation<OpportunityWorkspaceEntity> | null;
  dealId: string | null;
  searchVector: string;
}
