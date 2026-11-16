import { Injectable, Logger } from '@nestjs/common';

import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { buildPipelineSelectOptions, isDefined } from 'twenty-shared/utils';

import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { PipelineConfigService } from 'src/modules/pipeline/services/pipeline-config.service';

type SelectOption = {
  id: string;
  value: string;
  label: string;
  position: number;
  color: string;
};

const OPPORTUNITY_FIELDS = STANDARD_OBJECTS.opportunity.fields;

const toComparableOptions = (options: unknown) =>
  JSON.stringify(
    ((options ?? []) as SelectOption[]).map(
      ({ id, value, label, position, color }) => ({
        id,
        value,
        label,
        position,
        color,
      }),
    ),
  );

const toDefaultValue = (value: string | null) =>
  isDefined(value) ? `'${value}'` : null;

// The pipeline config is the source of truth for the Pipeline and Deal Stage options
@Injectable()
export class PipelineSyncService {
  private readonly logger = new Logger(PipelineSyncService.name);

  constructor(
    private readonly pipelineConfigService: PipelineConfigService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly applicationService: ApplicationService,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  ) {}

  async syncOpportunitySelectFields(workspaceId: string): Promise<boolean> {
    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId,
    });

    if (pipelines.length === 0) {
      return false;
    }

    const { flatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        { workspaceId, flatMapsKeys: ['flatFieldMetadataMaps'] },
      );

    const pipelineField =
      findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
        flatEntityMaps: flatFieldMetadataMaps,
        universalIdentifier: OPPORTUNITY_FIELDS.pipeline.universalIdentifier,
      });
    const stageField = findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
      flatEntityMaps: flatFieldMetadataMaps,
      universalIdentifier: OPPORTUNITY_FIELDS.stage.universalIdentifier,
    });

    if (!isDefined(pipelineField) || !isDefined(stageField)) {
      return false;
    }

    const built = buildPipelineSelectOptions({
      pipelines: pipelines.map((pipeline) => ({
        key: pipeline.key,
        name: pipeline.name,
        stages: pipeline.stages.map(({ value, label, color }) => ({
          value,
          label,
          color,
        })),
      })),
      pipelineFieldUniversalIdentifier:
        OPPORTUNITY_FIELDS.pipeline.universalIdentifier,
      stageFieldUniversalIdentifier:
        OPPORTUNITY_FIELDS.stage.universalIdentifier,
      existingPipelineOptions: (pipelineField.options ?? []) as SelectOption[],
      existingStageOptions: (stageField.options ?? []) as SelectOption[],
    });

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    let hasChanged = false;

    for (const { field, options, defaultValue } of [
      {
        field: pipelineField,
        options: built.pipelineOptions,
        defaultValue: toDefaultValue(built.defaultPipelineValue),
      },
      {
        field: stageField,
        options: built.stageOptions,
        defaultValue: toDefaultValue(built.defaultStageValue),
      },
    ]) {
      if (
        toComparableOptions(field.options) === toComparableOptions(options) &&
        field.defaultValue === defaultValue
      ) {
        continue;
      }

      await this.fieldMetadataService.updateOneField({
        workspaceId,
        isSystemBuild: true,
        ownerFlatApplication: twentyStandardFlatApplication,
        updateFieldInput: {
          id: field.id,
          options,
          defaultValue,
        },
      });
      hasChanged = true;
    }

    if (hasChanged) {
      this.logger.log(
        `Workspace ${workspaceId}: synced ${built.pipelineOptions.length} pipeline and ${built.stageOptions.length} stage options`,
      );
    }

    return hasChanged;
  }
}
