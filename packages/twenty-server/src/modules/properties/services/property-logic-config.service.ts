import { Injectable } from '@nestjs/common';

import { type ConditionalLogicRule, isDefined } from 'twenty-shared/utils';
import { IsNull } from 'typeorm';

import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type PropertyGroupMembershipWorkspaceEntity } from 'src/modules/properties/standard-objects/property-group-membership.workspace-entity';
import { type PropertyLogicRuleWorkspaceEntity } from 'src/modules/properties/standard-objects/property-logic-rule.workspace-entity';
import { buildPropertyLogicRulesByObjectMetadataId } from 'src/modules/properties/utils/build-property-logic-rules.util';

// Every record write asks for the rules, so they are read at most once per interval per server
const CACHE_TTL_MILLISECONDS = 15_000;

type CachedRules = {
  loadedAt: number;
  rulesByObjectMetadataId: Map<string, ConditionalLogicRule[]>;
};

@Injectable()
export class PropertyLogicConfigService {
  private readonly cacheByWorkspaceId = new Map<string, CachedRules>();

  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  invalidate(workspaceId: string) {
    this.cacheByWorkspaceId.delete(workspaceId);
  }

  // Must run inside a workspace context
  async getRules({
    workspaceId,
    objectMetadataId,
  }: {
    workspaceId: string;
    objectMetadataId: string;
  }): Promise<ConditionalLogicRule[]> {
    const cached = this.cacheByWorkspaceId.get(workspaceId);

    if (
      isDefined(cached) &&
      Date.now() - cached.loadedAt < CACHE_TTL_MILLISECONDS
    ) {
      return cached.rulesByObjectMetadataId.get(objectMetadataId) ?? [];
    }

    const rulesByObjectMetadataId = await this.load();

    this.cacheByWorkspaceId.set(workspaceId, {
      loadedAt: Date.now(),
      rulesByObjectMetadataId,
    });

    return rulesByObjectMetadataId.get(objectMetadataId) ?? [];
  }

  private async load(): Promise<Map<string, ConditionalLogicRule[]>> {
    const { objectIdByNameSingular, flatFieldMetadataMaps } =
      getWorkspaceContext();

    if (!isDefined(objectIdByNameSingular['propertyLogicRule'])) {
      return new Map();
    }

    const ruleRepository =
      this.workspaceOrmManager.getRepository<PropertyLogicRuleWorkspaceEntity>(
        'propertyLogicRule',
        { shouldBypassPermissionChecks: true },
      );
    const membershipRepository =
      this.workspaceOrmManager.getRepository<PropertyGroupMembershipWorkspaceEntity>(
        'propertyGroupMembership',
        { shouldBypassPermissionChecks: true },
      );

    const [rules, memberships] = await Promise.all([
      ruleRepository.find({
        where: { deletedAt: IsNull() },
        order: { position: 'ASC' },
      }),
      membershipRepository.find({ where: { deletedAt: IsNull() } }),
    ]);

    const fieldNameById = new Map(
      Object.values(flatFieldMetadataMaps.byUniversalIdentifier)
        .filter(isDefined)
        .map((field) => [field.id, field.name]),
    );

    return buildPropertyLogicRulesByObjectMetadataId({
      rules,
      memberships,
      fieldNameById,
    });
  }
}
