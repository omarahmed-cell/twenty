import { Injectable, Logger } from '@nestjs/common';

import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { FieldMetadataType } from 'twenty-shared/types';
import {
  isDefined,
  normalizeStageCalculatedPropertyKinds,
  PIPELINE_OBJECT_NAMES,
  type PipelineObjectNameSingular,
} from 'twenty-shared/utils';

import { getFlatFieldsFromFlatObjectMetadata } from 'src/engine/api/graphql/workspace-schema-builder/utils/get-flat-fields-for-flat-object-metadata.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { ViewFieldService } from 'src/engine/metadata-modules/view-field/services/view-field.service';
import { WorkspaceMigrationBuilderException } from 'src/engine/workspace-manager/workspace-migration/exceptions/workspace-migration-builder-exception';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { DealStageHistoryService } from 'src/modules/deal-stage-history/services/deal-stage-history.service';
import { PipelineConfigService } from 'src/modules/pipeline/services/pipeline-config.service';
import {
  isStageCalculatedPropertyFieldName,
  planDealStageCalculatedPropertyFields,
  type StageCalculatedPropertyFieldSpec,
} from 'src/modules/pipeline/utils/plan-deal-stage-calculated-property-fields.util';

type StageCalculatedPropertyKind = StageCalculatedPropertyFieldSpec['kind'];

const DEAL_DESCRIPTION_BY_KIND: Record<StageCalculatedPropertyKind, string> = {
  dateEntered: 'The latest time the deal entered this stage',
  dateExited: 'The latest time the deal left this stage',
  cumulativeTimeIn: 'Days in this stage over all completed stays',
  latestTimeIn: 'Days of the most recent completed stay in this stage',
};

const RECORD_DESCRIPTION_BY_KIND: Record<StageCalculatedPropertyKind, string> =
  {
    ...DEAL_DESCRIPTION_BY_KIND,
    dateEntered: 'The latest time the record entered this stage',
    dateExited: 'The latest time the record left this stage',
  };

// Keeps each pipeline object's per-stage fields in line with the stages' "Stage calculated properties"
// toggles and the kinds checked on their pipeline
@Injectable()
export class DealStageCalculatedPropertiesService {
  private readonly logger = new Logger(
    DealStageCalculatedPropertiesService.name,
  );

  constructor(
    private readonly pipelineConfigService: PipelineConfigService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly viewFieldService: ViewFieldService,
    private readonly applicationService: ApplicationService,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
    private readonly dealStageHistoryService: DealStageHistoryService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {}

  async syncFields(
    workspaceId: string,
    objectNameSingular?: PipelineObjectNameSingular,
  ): Promise<void> {
    for (const pipelineObjectNameSingular of isDefined(objectNameSingular)
      ? [objectNameSingular]
      : PIPELINE_OBJECT_NAMES) {
      await this.syncObjectFields(workspaceId, pipelineObjectNameSingular);
    }
  }

  private async syncObjectFields(
    workspaceId: string,
    objectNameSingular: PipelineObjectNameSingular,
  ): Promise<void> {
    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );
    const pipelineObject = await this.findPipelineObject(
      workspaceId,
      objectNameSingular,
    );

    if (!isDefined(pipelineObject)) {
      return;
    }

    const fixedFieldNames = new Set(
      Object.keys(STANDARD_OBJECTS[objectNameSingular].fields),
    );
    const descriptionByKind =
      objectNameSingular === 'opportunity'
        ? DEAL_DESCRIPTION_BY_KIND
        : RECORD_DESCRIPTION_BY_KIND;
    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
      objectNameSingular,
    });
    const { flatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        { workspaceId, flatMapsKeys: ['flatFieldMetadataMaps'] },
      );
    const existingFields = getFlatFieldsFromFlatObjectMetadata(
      pipelineObject,
      flatFieldMetadataMaps,
    ).filter(
      (field) =>
        field.applicationId === twentyStandardFlatApplication.id &&
        isStageCalculatedPropertyFieldName(field.name, fixedFieldNames),
    );

    const plan = planDealStageCalculatedPropertyFields({
      stages: pipelines.flatMap((pipeline) => {
        const kinds = normalizeStageCalculatedPropertyKinds(
          pipeline.stageCalculatedPropertyKinds,
        );

        return pipeline.stages.map((stage) => ({
          value: stage.value,
          label: stage.label,
          pipelineName: pipeline.name,
          calcPropsEnabled: stage.calcPropsEnabled,
          kinds,
        }));
      }),
      existingFields: existingFields.map(({ id, name, label, isActive }) => ({
        id,
        name,
        label,
        isActive,
      })),
    });

    if (plan.toCreate.length > 0) {
      const created = await this.fieldMetadataService.createManyFields({
        workspaceId,
        ownerFlatApplication: twentyStandardFlatApplication,
        isSystemBuild: true,
        createFieldInputs: plan.toCreate.map((spec) => ({
          objectMetadataId: pipelineObject.id,
          name: spec.name,
          label: spec.label,
          type: spec.type,
          description: descriptionByKind[spec.kind],
          icon:
            spec.type === FieldMetadataType.DATE_TIME
              ? 'IconCalendarEvent'
              : 'IconHourglass',
          isNullable: true,
          isUIEditable: false,
          universalIdentifier: spec.universalIdentifier,
          ...(spec.type === FieldMetadataType.NUMBER
            ? { settings: { decimals: 1, type: 'number' } }
            : {}),
        })),
      });

      await this.hideInViews({
        workspaceId,
        fieldMetadataIds: created.map(({ id }) => id),
      });
    }

    for (const { id, label, isActive } of plan.toUpdate) {
      await this.fieldMetadataService.updateOneField({
        workspaceId,
        isSystemBuild: true,
        ownerFlatApplication: twentyStandardFlatApplication,
        updateFieldInput: {
          id,
          ...(isDefined(label) ? { label } : {}),
          ...(isDefined(isActive) ? { isActive } : {}),
        },
      });
    }

    for (const field of plan.toDelete) {
      // Deactivating first clears the field from views, filters and sorts
      if (field.isActive) {
        await this.fieldMetadataService.updateOneField({
          workspaceId,
          isSystemBuild: true,
          ownerFlatApplication: twentyStandardFlatApplication,
          updateFieldInput: { id: field.id, isActive: false },
        });
      }
    }

    if (plan.toDelete.length > 0) {
      await this.deleteFields({
        workspaceId,
        fieldIds: plan.toDelete.map(({ id }) => id),
        applicationUniversalIdentifier:
          twentyStandardFlatApplication.universalIdentifier,
      });
    }

    if (plan.stageValuesToBackfill.length > 0) {
      await this.dealStageHistoryService.recomputeRecords({
        workspaceId,
        objectNameSingular,
      });
    }

    const changeCount =
      plan.toCreate.length + plan.toUpdate.length + plan.toDelete.length;

    if (changeCount > 0) {
      this.logger.log(
        `Workspace ${workspaceId}: ${objectNameSingular} stage calculated properties created ${plan.toCreate.length}, updated ${plan.toUpdate.length}, deleted ${plan.toDelete.length}`,
      );
    }
  }

  // deleteOneField refuses every standard field, so the generated ones are removed through the migration directly
  private async deleteFields({
    workspaceId,
    fieldIds,
    applicationUniversalIdentifier,
  }: {
    workspaceId: string;
    fieldIds: string[];
    applicationUniversalIdentifier: string;
  }) {
    const { flatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        { workspaceId, flatMapsKeys: ['flatFieldMetadataMaps'] },
      );
    const fieldsToDelete = fieldIds
      .map((fieldId) =>
        findFlatEntityByIdInFlatEntityMaps({
          flatEntityId: fieldId,
          flatEntityMaps: flatFieldMetadataMaps,
        }),
      )
      .filter(isDefined);

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate: [],
              flatEntityToDelete: fieldsToDelete,
              flatEntityToUpdate: [],
            },
          },
          workspaceId,
          isSystemBuild: true,
          applicationUniversalIdentifier,
        },
      );

    if (result.status === 'fail') {
      throw new WorkspaceMigrationBuilderException(
        result,
        'Multiple validation errors occurred while deleting stage calculated properties',
      );
    }
  }

  private async findPipelineObject(
    workspaceId: string,
    objectNameSingular: PipelineObjectNameSingular,
  ): Promise<FlatObjectMetadata | undefined> {
    const { flatObjectMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        { workspaceId, flatMapsKeys: ['flatObjectMetadataMaps'] },
      );

    return (
      findFlatEntityByUniversalIdentifier<FlatObjectMetadata>({
        flatEntityMaps: flatObjectMetadataMaps,
        universalIdentifier:
          STANDARD_OBJECTS[objectNameSingular].universalIdentifier,
      }) ?? undefined
    );
  }

  // New fields land visible in the object's table and record page; hiding them keeps those clean while
  // leaving the fields available in filters, columns, sorting and reports
  private async hideInViews({
    workspaceId,
    fieldMetadataIds,
  }: {
    workspaceId: string;
    fieldMetadataIds: string[];
  }) {
    const createdFieldIds = new Set(fieldMetadataIds);
    const { flatViewFieldMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        { workspaceId, flatMapsKeys: ['flatViewFieldMaps'] },
      );
    const visibleViewFieldIds = Object.values(
      flatViewFieldMaps.byUniversalIdentifier,
    )
      .filter(
        (viewField) =>
          isDefined(viewField) &&
          createdFieldIds.has(viewField.fieldMetadataId) &&
          viewField.isVisible &&
          !isDefined(viewField.deletedAt),
      )
      .map((viewField) => viewField?.id)
      .filter(isDefined);

    this.logger.log(
      `Workspace ${workspaceId}: hiding ${visibleViewFieldIds.length} view fields of ${fieldMetadataIds.length} new fields`,
    );

    for (const id of visibleViewFieldIds) {
      await this.viewFieldService.updateOne({
        workspaceId,
        updateViewFieldInput: { id, update: { isVisible: false } },
      });
    }
  }
}
