import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { formatPipelineStageLabel, isDefined } from 'twenty-shared/utils';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';

// Charts list every stage of every pipeline, so same-named stages ("Closed Lost") carry their pipeline name
export const prefixDealStageOptionLabels = ({
  flatFieldMetadataMaps,
  pipelines,
}: {
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  pipelines: PipelineConfig[];
}): FlatEntityMaps<FlatFieldMetadata> => {
  const stageUniversalIdentifier =
    STANDARD_OBJECTS.opportunity.fields.stage.universalIdentifier;
  const stageField =
    flatFieldMetadataMaps.byUniversalIdentifier[stageUniversalIdentifier];

  if (!isDefined(stageField) || pipelines.length === 0) {
    return flatFieldMetadataMaps;
  }

  const pipelineNameByStageValue = new Map(
    pipelines.flatMap((pipeline) =>
      pipeline.stages.map((stage) => [stage.value, pipeline.name] as const),
    ),
  );

  return {
    ...flatFieldMetadataMaps,
    byUniversalIdentifier: {
      ...flatFieldMetadataMaps.byUniversalIdentifier,
      [stageUniversalIdentifier]: {
        ...stageField,
        options: (stageField.options ?? []).map((option) => ({
          ...option,
          label: formatPipelineStageLabel({
            pipelineName: pipelineNameByStageValue.get(option.value),
            stageLabel: option.label,
          }),
        })),
      } as FlatFieldMetadata,
    },
  };
};
