import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardPipelineStageViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'pipelineStage'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allPipelineStagesLabel: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'pipelineStage',
      context: {
        viewName: 'allPipelineStages',
        viewFieldName: 'label',
        fieldName: 'label',
        position: 0,
        isVisible: true,
        size: 180,
      },
    }),
    allPipelineStagesPipeline: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'pipelineStage',
      context: {
        viewName: 'allPipelineStages',
        viewFieldName: 'pipeline',
        fieldName: 'pipeline',
        position: 1,
        isVisible: true,
        size: 180,
      },
    }),
    allPipelineStagesValue: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'pipelineStage',
      context: {
        viewName: 'allPipelineStages',
        viewFieldName: 'value',
        fieldName: 'value',
        position: 2,
        isVisible: true,
        size: 180,
      },
    }),
    allPipelineStagesProbability: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'pipelineStage',
      context: {
        viewName: 'allPipelineStages',
        viewFieldName: 'probability',
        fieldName: 'probability',
        position: 3,
        isVisible: true,
        size: 180,
      },
    }),
  };
};
