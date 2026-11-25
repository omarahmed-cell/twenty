import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { randomUUID } from 'crypto';

import { computeMetadataNameFromLabel } from 'twenty-shared/metadata';
import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { type OrmFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/orm-flat-field-metadata.type';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { RoboostScoreEngineService } from 'src/modules/roboost-scoring/services/roboost-score-engine.service';
import { type RecordLayoutWorkspaceEntity } from 'src/modules/properties/standard-objects/record-layout.workspace-entity';
import { type PropertyGroupMembershipWorkspaceEntity } from 'src/modules/properties/standard-objects/property-group-membership.workspace-entity';
import { type PropertyGroupWorkspaceEntity } from 'src/modules/properties/standard-objects/property-group.workspace-entity';

export const ROBOOST_SCORES_PROPERTY_GROUP_NAME = 'Scores';

export type RoboostScoreFieldSettings = {
  roboostScoreId?: string;
  [key: string]: unknown;
};

export type RoboostScoreEligibleField = {
  id: string;
  label: string;
  name: string;
};

const getScoreId = (field: OrmFlatFieldMetadata) =>
  (field.settings as RoboostScoreFieldSettings | null)?.roboostScoreId;

@Injectable()
export class RoboostScorePropertyService {
  private readonly logger = new Logger(RoboostScorePropertyService.name);

  constructor(
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly roboostScoreEngineService: RoboostScoreEngineService,
  ) {}

  private async getFields(workspaceId: string, objectName: string) {
    await this.workspaceCacheService.evictWorkspaceFromLocalCache(workspaceId);

    return this.roboostScoreEngineService.runInWorkspace(
      workspaceId,
      async () => ({
        fields: this.roboostScoreEngineService.getObjectFields(objectName),
        objectMetadataId:
          getWorkspaceContext().objectIdByNameSingular[objectName],
      }),
    );
  }

  async getField(workspaceId: string, objectName: string, fieldId: string) {
    const { fields } = await this.getFields(workspaceId, objectName);

    return [...fields.values()].find((field) => field.id === fieldId) ?? null;
  }

  // Number fields the user can hand to a score: not system, not calculated, not another score's
  async listEligibleFields(
    workspaceId: string,
    objectName: string,
    linkedFieldIds: string[],
  ): Promise<RoboostScoreEligibleField[]> {
    const { fields } = await this.getFields(workspaceId, objectName);
    const formulaOf = (field: OrmFlatFieldMetadata) =>
      (field.settings as { formula?: unknown } | null)?.formula;

    return [...fields.values()]
      .filter(
        (field) =>
          field.type === FieldMetadataType.NUMBER &&
          field.isActive &&
          field.isSystem !== true &&
          field.isUIEditable !== false &&
          !isDefined(formulaOf(field)) &&
          !isDefined(getScoreId(field)) &&
          !linkedFieldIds.includes(field.id),
      )
      .map(({ id, label, name }) => ({ id, label, name }))
      .sort((first, second) => first.label.localeCompare(second.label));
  }

  async createProperty({
    workspaceId,
    objectName,
    label,
    scoreId,
    scoreName,
  }: {
    workspaceId: string;
    objectName: string;
    label: string;
    scoreId: string;
    scoreName: string;
  }): Promise<
    OrmFlatFieldMetadata | { id: string; name: string; label: string }
  > {
    const { fields, objectMetadataId } = await this.getFields(
      workspaceId,
      objectName,
    );
    const trimmedLabel = label.trim();

    if (trimmedLabel === '') {
      throw new BadRequestException('A property name is required');
    }
    if (
      [...fields.values()].some(
        (field) => field.label.toLowerCase() === trimmedLabel.toLowerCase(),
      )
    ) {
      throw new BadRequestException(
        `A property named "${trimmedLabel}" already exists on this object`,
      );
    }
    const baseName = computeMetadataNameFromLabel({ label: trimmedLabel });
    let name = baseName;

    for (let suffix = 2; fields.has(name); suffix += 1) {
      name = `${baseName}${suffix}`;
    }

    const field = await this.fieldMetadataService.createOneField({
      workspaceId,
      createFieldInput: {
        objectMetadataId,
        type: FieldMetadataType.NUMBER,
        name,
        label: trimmedLabel,
        description: `Calculated automatically by the score "${scoreName}"`,
        icon: 'IconGauge',
        isNullable: true,
        isUIEditable: false,
        settings: {
          type: 'number',
          decimals: 1,
          roboostScoreId: scoreId,
        } as never,
      },
    });

    await this.addToScoresGroup(workspaceId, objectMetadataId, field.id);
    await this.addToRecordLayouts(workspaceId, objectMetadataId, field.name);

    return field;
  }

  // An existing field keeps its type and history; it only becomes read-only and owned by the score
  async linkExistingField({
    workspaceId,
    field,
    scoreId,
    objectMetadataId,
  }: {
    workspaceId: string;
    field: OrmFlatFieldMetadata;
    scoreId: string;
    objectMetadataId: string;
  }) {
    await this.fieldMetadataService.updateOneField({
      workspaceId,
      updateFieldInput: {
        id: field.id,
        isUIEditable: false,
        settings: {
          ...((field.settings as object | null) ?? {}),
          roboostScoreId: scoreId,
        } as never,
      },
    });
    await this.addToScoresGroup(workspaceId, objectMetadataId, field.id);
    await this.addToRecordLayouts(workspaceId, objectMetadataId, field.name);
  }

  async getObjectMetadataId(workspaceId: string, objectName: string) {
    return (await this.getFields(workspaceId, objectName)).objectMetadataId;
  }

  // The property stays a normal read-only number with its values; it is just no longer the score's
  async unlinkField(workspaceId: string, objectName: string, fieldId: string) {
    const field = await this.getField(workspaceId, objectName, fieldId);

    if (!isDefined(field)) {
      return;
    }
    const { roboostScoreId: _removed, ...settings } =
      (field.settings as RoboostScoreFieldSettings | null) ?? {};

    await this.fieldMetadataService.updateOneField({
      workspaceId,
      updateFieldInput: {
        id: field.id,
        isUIEditable: false,
        description: '',
        settings: settings as never,
      },
    });
  }

  async deleteField(workspaceId: string, objectName: string, fieldId: string) {
    const field = await this.getField(workspaceId, objectName, fieldId);

    if (!isDefined(field)) {
      return;
    }
    if (field.isActive) {
      await this.fieldMetadataService.updateOneField({
        workspaceId,
        updateFieldInput: { id: field.id, isActive: false },
      });
    }
    await this.fieldMetadataService.deleteOneField({
      workspaceId,
      deleteOneFieldInput: { id: field.id },
    });
  }

  // Saved record layouts list their fields by name, so a new score property would not show on
  // the record page (nor its "Why this score?") until someone adds it; it goes in a Scores card
  private async addToRecordLayouts(
    workspaceId: string,
    objectMetadataId: string,
    fieldName: string,
  ) {
    try {
      await this.roboostScoreEngineService.runInWorkspace(
        workspaceId,
        async () => {
          const repository =
            this.workspaceOrmManager.getRepository<RecordLayoutWorkspaceEntity>(
              'recordLayout',
              { shouldBypassPermissionChecks: true },
            );
          const layouts = await repository.find({
            where: { objectMetadataId },
          });

          for (const recordLayout of layouts) {
            const layout = recordLayout.layout as {
              left?: { id: string; title?: string; fieldNames?: string[] }[];
            } | null;

            if (!isDefined(layout) || !Array.isArray(layout.left)) {
              continue;
            }
            if (
              layout.left.some((card) => card.fieldNames?.includes(fieldName))
            ) {
              continue;
            }
            const scoresCard = layout.left.find(
              (card) => card.title === ROBOOST_SCORES_PROPERTY_GROUP_NAME,
            );
            const left = isDefined(scoresCard)
              ? layout.left.map((card) =>
                  card === scoresCard
                    ? {
                        ...card,
                        fieldNames: [...(card.fieldNames ?? []), fieldName],
                      }
                    : card,
                )
              : [
                  {
                    id: randomUUID(),
                    title: ROBOOST_SCORES_PROPERTY_GROUP_NAME,
                    fieldNames: [fieldName],
                  },
                  ...layout.left,
                ];

            await repository.update(
              { id: recordLayout.id },
              { layout: { ...layout, left } },
            );
          }
        },
      );
    } catch (error) {
      this.logger.warn(
        `Could not add ${fieldName} to the record layouts: ${error}`,
      );
    }
  }

  private async addToScoresGroup(
    workspaceId: string,
    objectMetadataId: string,
    fieldMetadataId: string,
  ) {
    try {
      await this.roboostScoreEngineService.runInWorkspace(
        workspaceId,
        async () => {
          const groupRepository =
            this.workspaceOrmManager.getRepository<PropertyGroupWorkspaceEntity>(
              'propertyGroup',
              { shouldBypassPermissionChecks: true },
            );
          const membershipRepository =
            this.workspaceOrmManager.getRepository<PropertyGroupMembershipWorkspaceEntity>(
              'propertyGroupMembership',
              { shouldBypassPermissionChecks: true },
            );
          const groups = await groupRepository.find({
            where: { objectMetadataId },
          });
          const findScoresGroup = (
            candidates: PropertyGroupWorkspaceEntity[],
          ) =>
            candidates.find(
              (candidate) =>
                candidate.name === ROBOOST_SCORES_PROPERTY_GROUP_NAME,
            );

          if (!isDefined(findScoresGroup(groups))) {
            await groupRepository.insert({
              name: ROBOOST_SCORES_PROPERTY_GROUP_NAME,
              objectMetadataId,
              position:
                Math.max(0, ...groups.map((candidate) => candidate.position)) +
                1,
            });
          }
          const group = findScoresGroup(
            await groupRepository.find({ where: { objectMetadataId } }),
          );

          if (!isDefined(group)) {
            return;
          }
          const memberships = await membershipRepository.find({
            where: { objectMetadataId },
          });

          await membershipRepository.delete({
            objectMetadataId,
            fieldMetadataId,
          });
          await membershipRepository.save({
            propertyGroupId: group.id,
            fieldMetadataId,
            objectMetadataId,
            position:
              Math.max(
                0,
                ...memberships
                  .filter(
                    (membership) => membership.propertyGroupId === group.id,
                  )
                  .map((membership) => membership.position),
              ) + 1,
          });
        },
      );
    } catch (error) {
      this.logger.warn(
        `Could not add field ${fieldMetadataId} to the Scores group: ${error}`,
      );
    }
  }
}
