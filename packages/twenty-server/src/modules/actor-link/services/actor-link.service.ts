import { Injectable } from '@nestjs/common';

import { isString } from '@sniptt/guards';
import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { In, IsNull, MoreThan } from 'typeorm';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace-repository';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { type HubspotOwnerMap } from 'src/modules/actor-link/types/hubspot-owner.type';
import { type MemberLinkUpdate } from 'src/modules/actor-link/types/member-link-update.type';
import { type OwnerResolution } from 'src/modules/actor-link/types/owner-resolution.type';
import { type PendingMemberLink } from 'src/modules/actor-link/types/pending-member-link.type';
import {
  buildOwnerNameIndex,
  planOwnerNameMatchUpdates,
} from 'src/modules/actor-link/utils/plan-owner-name-matches.util';
import {
  type LinkTargetRecord,
  planPendingLinkUpdates,
} from 'src/modules/actor-link/utils/plan-pending-link-updates.util';
import { resolveHubspotOwners } from 'src/modules/actor-link/utils/resolve-hubspot-owners.util';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

const CREATED_BY_FIELD_NAME = 'createdBy';
const CREATED_BY_MEMBER_COLUMN_NAME = 'createdByWorkspaceMemberId';
const WORKSPACE_MEMBER_OBJECT_NAME = 'workspaceMember';
const BATCH_SIZE = 500;

export type ActorLinkSummaryRow = {
  objectName: string;
  fieldName: string;
  filledCount: number;
  alreadyLinkedCount: number;
  unresolvedOwnerCount: number;
  missingRecordCount: number;
  deletedRecordCount: number;
};

export type ActorLinkSkippedGroup = {
  objectName: string;
  fieldName: string;
  linkCount: number;
  reason: string;
};

export type ActorLinkReport = {
  ownerResolutionByOwnerId: Record<string, OwnerResolution>;
  pendingLinkRows: ActorLinkSummaryRow[];
  skippedGroups: ActorLinkSkippedGroup[];
  nameMatchRows: { objectName: string; filledCount: number }[];
  duplicateOwnerNames: string[];
  unresolvedOwnerNames: string[];
};

type LinkTarget = {
  // Physical column: reads and the IS NULL guard use it, writes go through the field
  memberColumnName: string;
  buildUpdateData: (workspaceMemberId: string) => Record<string, unknown>;
};

type ActorLinkRecord = Record<string, unknown> & {
  id: string;
  deletedAt?: string | null;
  createdBy?: { workspaceMemberId?: string | null; name?: string | null };
};

const CREATED_BY_LINK_TARGET: LinkTarget = {
  memberColumnName: CREATED_BY_MEMBER_COLUMN_NAME,
  buildUpdateData: (workspaceMemberId) => ({
    createdBy: { workspaceMemberId },
  }),
};

const chunk = <TItem>(items: TItem[], size: number): TItem[][] => {
  const chunks: TItem[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const groupBy = <TItem>(
  items: TItem[],
  getKey: (item: TItem) => string,
): Map<string, TItem[]> => {
  const itemsByKey = new Map<string, TItem[]>();

  for (const item of items) {
    const key = getKey(item);

    itemsByKey.set(key, [...(itemsByKey.get(key) ?? []), item]);
  }

  return itemsByKey;
};

@Injectable()
export class ActorLinkService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  async linkMembers({
    workspaceId,
    ownerMap,
    links,
    shouldMatchNames,
    isDryRun,
  }: {
    workspaceId: string;
    ownerMap: HubspotOwnerMap;
    links: PendingMemberLink[];
    shouldMatchNames: boolean;
    isDryRun: boolean;
  }): Promise<ActorLinkReport> {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
      ]);

    const flatObjectMetadatas = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    ).filter(isDefined);
    const flatFieldMetadatas = Object.values(
      flatFieldMetadataMaps.byUniversalIdentifier,
    ).filter(isDefined);

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const workspaceMembers = await this.getRepository<
        Pick<WorkspaceMemberWorkspaceEntity, 'id' | 'userEmail'>
      >(WORKSPACE_MEMBER_OBJECT_NAME).find({
        select: { id: true, userEmail: true },
      });

      const ownerResolutionByOwnerId = resolveHubspotOwners({
        ownerMap,
        workspaceMembers,
      });

      const report: ActorLinkReport = {
        ownerResolutionByOwnerId,
        pendingLinkRows: [],
        skippedGroups: [],
        nameMatchRows: [],
        duplicateOwnerNames: [],
        unresolvedOwnerNames: [],
      };

      const linksByGroupKey = groupBy(
        links,
        (link) => `${link.object}.${link.field}`,
      );

      for (const groupLinks of linksByGroupKey.values()) {
        const { object: objectName, field: fieldName } = groupLinks[0];
        const linkTargetOrSkipReason = this.resolveLinkTarget({
          objectName,
          fieldName,
          flatObjectMetadatas,
          flatFieldMetadatas,
        });

        if (isString(linkTargetOrSkipReason)) {
          report.skippedGroups.push({
            objectName,
            fieldName,
            linkCount: groupLinks.length,
            reason: linkTargetOrSkipReason,
          });
          continue;
        }

        report.pendingLinkRows.push(
          await this.applyPendingLinks({
            objectName,
            fieldName,
            links: groupLinks,
            linkTarget: linkTargetOrSkipReason,
            ownerResolutionByOwnerId,
            isDryRun,
          }),
        );
      }

      if (!shouldMatchNames) {
        return report;
      }

      const ownerNameIndex = buildOwnerNameIndex({
        ownerMap,
        ownerResolutionByOwnerId,
      });

      report.duplicateOwnerNames = ownerNameIndex.duplicateNames;
      report.unresolvedOwnerNames = ownerNameIndex.unresolvedNames;

      if (ownerNameIndex.workspaceMemberIdByName.size === 0) {
        return report;
      }

      for (const flatObjectMetadata of this.findObjectsWithActorCreatedBy({
        flatObjectMetadatas,
        flatFieldMetadatas,
      })) {
        report.nameMatchRows.push({
          objectName: flatObjectMetadata.nameSingular,
          filledCount: await this.applyOwnerNameMatches({
            objectName: flatObjectMetadata.nameSingular,
            workspaceMemberIdByName: ownerNameIndex.workspaceMemberIdByName,
            isDryRun,
          }),
        });
      }

      return report;
    }, buildSystemAuthContext(workspaceId));
  }

  // Events are skipped so the backfill does not add an update to every record timeline
  private getRepository<TEntity extends object>(
    objectName: string,
  ): WorkspaceRepository<TEntity> {
    return this.workspaceOrmManager.getRepository<TEntity>(
      objectName,
      { shouldBypassPermissionChecks: true },
      { shouldSkipEventEmission: true },
    );
  }

  private resolveLinkTarget({
    objectName,
    fieldName,
    flatObjectMetadatas,
    flatFieldMetadatas,
  }: {
    objectName: string;
    fieldName: string;
    flatObjectMetadatas: FlatObjectMetadata[];
    flatFieldMetadatas: FlatFieldMetadata[];
  }): LinkTarget | string {
    const flatObjectMetadata = flatObjectMetadatas.find(
      (objectMetadata) => objectMetadata.nameSingular === objectName,
    );

    if (!isDefined(flatObjectMetadata) || !flatObjectMetadata.isActive) {
      return `object "${objectName}" not found or inactive`;
    }

    const flatFieldMetadata = flatFieldMetadatas.find(
      (fieldMetadata) =>
        fieldMetadata.objectMetadataId === flatObjectMetadata.id &&
        fieldMetadata.name === fieldName,
    );

    if (!isDefined(flatFieldMetadata) || !flatFieldMetadata.isActive) {
      return `field "${fieldName}" not found or inactive`;
    }

    if (fieldName === CREATED_BY_FIELD_NAME) {
      return flatFieldMetadata.type === FieldMetadataType.ACTOR
        ? CREATED_BY_LINK_TARGET
        : `field "${fieldName}" is not an ACTOR field`;
    }

    const workspaceMemberObjectMetadataId = flatObjectMetadatas.find(
      (objectMetadata) =>
        objectMetadata.nameSingular === WORKSPACE_MEMBER_OBJECT_NAME,
    )?.id;
    const relationSettings =
      flatFieldMetadata.type === FieldMetadataType.RELATION
        ? (flatFieldMetadata as FlatFieldMetadata<FieldMetadataType.RELATION>)
            .settings
        : null;

    if (
      relationSettings?.relationType !== RelationType.MANY_TO_ONE ||
      !isDefined(workspaceMemberObjectMetadataId) ||
      flatFieldMetadata.relationTargetObjectMetadataId !==
        workspaceMemberObjectMetadataId
    ) {
      return `field "${fieldName}" is not a MANY_TO_ONE relation to workspaceMember`;
    }

    const joinColumnName = relationSettings.joinColumnName ?? `${fieldName}Id`;

    return {
      memberColumnName: joinColumnName,
      buildUpdateData: (workspaceMemberId) => ({
        [joinColumnName]: workspaceMemberId,
      }),
    };
  }

  private async applyPendingLinks({
    objectName,
    fieldName,
    links,
    linkTarget,
    ownerResolutionByOwnerId,
    isDryRun,
  }: {
    objectName: string;
    fieldName: string;
    links: PendingMemberLink[];
    linkTarget: LinkTarget;
    ownerResolutionByOwnerId: Record<string, OwnerResolution>;
    isDryRun: boolean;
  }): Promise<ActorLinkSummaryRow> {
    const repository = this.getRepository<ActorLinkRecord>(objectName);
    const recordsById = new Map<string, LinkTargetRecord>();
    const recordIds = [...new Set(links.map((link) => link.recordId))];

    for (const recordIdsChunk of chunk(recordIds, BATCH_SIZE)) {
      // The ORM only rebuilds the createdBy composite when the whole row is read
      const records = await repository.find({
        select:
          linkTarget === CREATED_BY_LINK_TARGET
            ? undefined
            : {
                id: true,
                deletedAt: true,
                [linkTarget.memberColumnName]: true,
              },
        where: { id: In(recordIdsChunk) },
        withDeleted: true,
      });

      for (const record of records) {
        const linkedWorkspaceMemberId =
          linkTarget === CREATED_BY_LINK_TARGET
            ? record.createdBy?.workspaceMemberId
            : record[linkTarget.memberColumnName];

        recordsById.set(record.id, {
          id: record.id,
          linkedWorkspaceMemberId: isString(linkedWorkspaceMemberId)
            ? linkedWorkspaceMemberId
            : null,
          isDeleted: isDefined(record.deletedAt),
        });
      }
    }

    const plan = planPendingLinkUpdates({
      links,
      recordsById,
      ownerResolutionByOwnerId,
    });

    return {
      objectName,
      fieldName,
      filledCount: isDryRun
        ? plan.updates.length
        : await this.applyUpdates({
            repository,
            updates: plan.updates,
            linkTarget,
          }),
      alreadyLinkedCount: plan.alreadyLinkedCount,
      unresolvedOwnerCount: plan.unresolvedOwnerCount,
      missingRecordCount: plan.missingRecordCount,
      deletedRecordCount: plan.deletedRecordCount,
    };
  }

  // The IS NULL guard keeps a link written since the read from being replaced
  private async applyUpdates({
    repository,
    updates,
    linkTarget,
  }: {
    repository: WorkspaceRepository<ActorLinkRecord>;
    updates: MemberLinkUpdate[];
    linkTarget: LinkTarget;
  }): Promise<number> {
    let affectedCount = 0;

    for (const [workspaceMemberId, memberUpdates] of groupBy(
      updates,
      (update) => update.workspaceMemberId,
    )) {
      for (const updatesChunk of chunk(memberUpdates, BATCH_SIZE)) {
        const result = await repository.update(
          {
            id: In(updatesChunk.map((update) => update.recordId)),
            [linkTarget.memberColumnName]: IsNull(),
          },
          linkTarget.buildUpdateData(workspaceMemberId),
        );

        affectedCount += result.affected ?? 0;
      }
    }

    return affectedCount;
  }

  private findObjectsWithActorCreatedBy({
    flatObjectMetadatas,
    flatFieldMetadatas,
  }: {
    flatObjectMetadatas: FlatObjectMetadata[];
    flatFieldMetadatas: FlatFieldMetadata[];
  }): FlatObjectMetadata[] {
    const objectMetadataIdsWithActorCreatedBy = new Set(
      flatFieldMetadatas
        .filter(
          (fieldMetadata) =>
            fieldMetadata.name === CREATED_BY_FIELD_NAME &&
            fieldMetadata.type === FieldMetadataType.ACTOR &&
            fieldMetadata.isActive,
        )
        .map((fieldMetadata) => fieldMetadata.objectMetadataId),
    );

    return flatObjectMetadatas.filter(
      (objectMetadata) =>
        objectMetadata.isActive &&
        objectMetadataIdsWithActorCreatedBy.has(objectMetadata.id),
    );
  }

  private async applyOwnerNameMatches({
    objectName,
    workspaceMemberIdByName,
    isDryRun,
  }: {
    objectName: string;
    workspaceMemberIdByName: Map<string, string>;
    isDryRun: boolean;
  }): Promise<number> {
    const repository = this.getRepository<ActorLinkRecord>(objectName);
    let lastRecordId: string | undefined;
    let filledCount = 0;

    // Keyset pagination stays correct while the scanned rows are being linked
    for (;;) {
      const records = await repository.find({
        select: {
          id: true,
          createdByName: true,
          [CREATED_BY_MEMBER_COLUMN_NAME]: true,
        },
        where: {
          [CREATED_BY_MEMBER_COLUMN_NAME]: IsNull(),
          ...(isDefined(lastRecordId) ? { id: MoreThan(lastRecordId) } : {}),
        },
        order: { id: 'ASC' },
        take: BATCH_SIZE,
      });

      if (records.length === 0) {
        return filledCount;
      }

      lastRecordId = records[records.length - 1].id;

      const updates = planOwnerNameMatchUpdates({
        records: records.map((record) => ({
          id: record.id,
          createdByName: record.createdBy?.name ?? null,
          createdByWorkspaceMemberId:
            record.createdBy?.workspaceMemberId ?? null,
        })),
        workspaceMemberIdByName,
      });

      filledCount += isDryRun
        ? updates.length
        : await this.applyUpdates({
            repository,
            updates,
            linkTarget: CREATED_BY_LINK_TARGET,
          });
    }
  }
}
