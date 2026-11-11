import { Injectable } from '@nestjs/common';

import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';
import { In, IsNull, Not } from 'typeorm';

import { getFlatFieldsFromFlatObjectMetadata } from 'src/engine/api/graphql/workspace-schema-builder/utils/get-flat-fields-for-flat-object-metadata.util';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { computeMorphOrRelationFieldJoinColumnName } from 'src/engine/metadata-modules/field-metadata/utils/compute-morph-or-relation-field-join-column-name.util';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type OrmFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/orm-flat-field-metadata.type';
import { isFlatFieldMetadataOfType } from 'src/engine/metadata-modules/flat-field-metadata/utils/is-flat-field-metadata-of-type.util';
import { isMorphOrRelationFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/utils/is-morph-or-relation-flat-field-metadata.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';

export type ActivityTargetJunction = {
  junctionObjectName:
    | 'noteTarget'
    | 'taskTarget'
    | 'callTarget'
    | 'communicationTarget'
    | 'emailTarget'
    | 'calendarEventTarget';
  activityIdFieldName:
    | 'noteId'
    | 'taskId'
    | 'callId'
    | 'communicationId'
    | 'emailId'
    | 'calendarEventId';
  createdTargetDefaults?: Record<string, boolean>;
};

type ActivityTargetRecord = Record<string, string | null> & { id: string };

type TargetLeg = {
  joinColumnName: string;
  targetFlatObjectMetadata: FlatObjectMetadata;
};

const getManyToOneJoinColumnName = (
  flatFieldMetadata: OrmFlatFieldMetadata,
): string | undefined => {
  if (
    !isMorphOrRelationFlatFieldMetadata(flatFieldMetadata) ||
    flatFieldMetadata.settings.relationType !== RelationType.MANY_TO_ONE
  ) {
    return undefined;
  }

  return (
    flatFieldMetadata.settings.joinColumnName ??
    computeMorphOrRelationFieldJoinColumnName({ name: flatFieldMetadata.name })
  );
};

@Injectable()
export class ActivityTargetCompanyCascadeService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async addParentCompanyTargets(
    authContext: WorkspaceAuthContext,
    {
      junctionObjectName,
      activityIdFieldName,
      createdTargetDefaults,
    }: ActivityTargetJunction,
    payload: { id: string }[],
  ): Promise<void> {
    if (!payload || payload.length === 0) {
      return;
    }

    assertIsDefinedOrThrow(
      authContext.workspace,
      WorkspaceNotFoundDefaultError,
    );

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const {
        flatObjectMetadataMaps,
        flatFieldMetadataMaps,
        objectIdByNameSingular,
      } = getWorkspaceContext();

      const companyObjectMetadataId = objectIdByNameSingular['company'];
      const junctionFlatObjectMetadata = findFlatEntityByIdInFlatEntityMaps({
        flatEntityId: objectIdByNameSingular[junctionObjectName],
        flatEntityMaps: flatObjectMetadataMaps,
      });

      if (
        !isDefined(companyObjectMetadataId) ||
        !isDefined(junctionFlatObjectMetadata)
      ) {
        return;
      }

      const activityTargetRepository =
        this.workspaceOrmManager.getRepository<ActivityTargetRecord>(
          junctionObjectName,
          { shouldBypassPermissionChecks: true },
        );

      const createdTargets = await activityTargetRepository.find({
        where: { id: In(payload.map((target) => target.id)) },
      });

      const targetLegs = this.getNonCompanyTargetLegs({
        junctionFlatObjectMetadata,
        flatObjectMetadataMaps,
        flatFieldMetadataMaps,
        companyObjectMetadataId,
      });

      const companyIdByJoinColumnNameAndRecordId = new Map<string, string>();

      for (const { joinColumnName, targetFlatObjectMetadata } of targetLegs) {
        const companyIdByRecordId = await this.findCompanyIdByRecordId({
          targetFlatObjectMetadata,
          flatFieldMetadataMaps,
          companyObjectMetadataId,
          recordIds: createdTargets.map((target) => target[joinColumnName]),
        });

        for (const [recordId, companyId] of companyIdByRecordId) {
          companyIdByJoinColumnNameAndRecordId.set(
            `${joinColumnName}:${recordId}`,
            companyId,
          );
        }
      }

      const parentCompanyLinks = createdTargets.flatMap((target) => {
        const activityId = target[activityIdFieldName];
        const companyId = targetLegs
          .map(({ joinColumnName }) =>
            companyIdByJoinColumnNameAndRecordId.get(
              `${joinColumnName}:${target[joinColumnName]}`,
            ),
          )
          .find(isDefined);

        return isDefined(activityId) && isDefined(companyId)
          ? [{ activityId, companyId }]
          : [];
      });

      if (parentCompanyLinks.length === 0) {
        return;
      }

      // Soft-deleted links count too, so a company link the user removed is not brought back
      const existingCompanyTargets = await activityTargetRepository.find({
        withDeleted: true,
        where: {
          [activityIdFieldName]: In(
            parentCompanyLinks.map((link) => link.activityId),
          ),
          targetCompanyId: Not(IsNull()),
        },
      });

      const linkedKeys = new Set(
        existingCompanyTargets.map(
          (target) =>
            `${target[activityIdFieldName]}:${target.targetCompanyId}`,
        ),
      );

      const targetsToCreate = parentCompanyLinks.flatMap(
        ({ activityId, companyId }) => {
          const linkKey = `${activityId}:${companyId}`;

          if (linkedKeys.has(linkKey)) {
            return [];
          }

          linkedKeys.add(linkKey);

          return [
            {
              [activityIdFieldName]: activityId,
              targetCompanyId: companyId,
              ...createdTargetDefaults,
            },
          ];
        },
      );

      if (targetsToCreate.length > 0) {
        // Participant sync can insert the same company link concurrently
        await activityTargetRepository.insert(targetsToCreate, {
          onConflictDoNothing: true,
        });
      }
    }, authContext);
  }

  private getNonCompanyTargetLegs({
    junctionFlatObjectMetadata,
    flatObjectMetadataMaps,
    flatFieldMetadataMaps,
    companyObjectMetadataId,
  }: {
    junctionFlatObjectMetadata: FlatObjectMetadata;
    flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
    flatFieldMetadataMaps: FlatEntityMaps<OrmFlatFieldMetadata>;
    companyObjectMetadataId: string;
  }): TargetLeg[] {
    return getFlatFieldsFromFlatObjectMetadata(
      junctionFlatObjectMetadata,
      flatFieldMetadataMaps,
    ).flatMap((flatFieldMetadata) => {
      const joinColumnName = getManyToOneJoinColumnName(flatFieldMetadata);
      const targetObjectMetadataId =
        flatFieldMetadata.relationTargetObjectMetadataId;

      if (
        !isFlatFieldMetadataOfType(
          flatFieldMetadata,
          FieldMetadataType.MORPH_RELATION,
        ) ||
        !isDefined(joinColumnName) ||
        !isDefined(targetObjectMetadataId) ||
        targetObjectMetadataId === companyObjectMetadataId
      ) {
        return [];
      }

      const targetFlatObjectMetadata = findFlatEntityByIdInFlatEntityMaps({
        flatEntityId: targetObjectMetadataId,
        flatEntityMaps: flatObjectMetadataMaps,
      });

      return isDefined(targetFlatObjectMetadata)
        ? [{ joinColumnName, targetFlatObjectMetadata }]
        : [];
    });
  }

  private async findCompanyIdByRecordId({
    targetFlatObjectMetadata,
    flatFieldMetadataMaps,
    companyObjectMetadataId,
    recordIds,
  }: {
    targetFlatObjectMetadata: FlatObjectMetadata;
    flatFieldMetadataMaps: FlatEntityMaps<OrmFlatFieldMetadata>;
    companyObjectMetadataId: string;
    recordIds: (string | null)[];
  }): Promise<Map<string, string>> {
    const definedRecordIds = recordIds.filter(isDefined);

    if (definedRecordIds.length === 0) {
      return new Map();
    }

    // Prefer a field named "company" when an object has several Company relations
    const companyJoinColumnName = getFlatFieldsFromFlatObjectMetadata(
      targetFlatObjectMetadata,
      flatFieldMetadataMaps,
    )
      .filter(
        (flatFieldMetadata) =>
          flatFieldMetadata.isActive &&
          flatFieldMetadata.relationTargetObjectMetadataId ===
            companyObjectMetadataId &&
          isDefined(getManyToOneJoinColumnName(flatFieldMetadata)),
      )
      .sort(
        (first, second) =>
          Number(second.name === 'company') -
            Number(first.name === 'company') ||
          first.name.localeCompare(second.name),
      )
      .map(getManyToOneJoinColumnName)
      .find(isDefined);

    if (!isDefined(companyJoinColumnName)) {
      return new Map();
    }

    const repository = this.workspaceOrmManager.getRepository<
      Record<string, string | null> & { id: string }
    >(targetFlatObjectMetadata.nameSingular, {
      shouldBypassPermissionChecks: true,
    });

    const records = await repository.find({
      select: { id: true, [companyJoinColumnName]: true },
      where: { id: In(definedRecordIds) },
    });

    return new Map(
      records.flatMap((record) => {
        const companyId = record[companyJoinColumnName];

        return isDefined(companyId) ? [[record.id, companyId] as const] : [];
      }),
    );
  }
}
