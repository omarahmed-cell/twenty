import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardPipelineViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'pipeline'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allPipelinesName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'pipeline',
      context: {
        viewName: 'allPipelines',
        viewFieldName: 'name',
        fieldName: 'name',
        position: 0,
        isVisible: true,
        size: 180,
      },
    }),
    allPipelinesDescription: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'pipeline',
      context: {
        viewName: 'allPipelines',
        viewFieldName: 'description',
        fieldName: 'description',
        position: 1,
        isVisible: true,
        size: 180,
      },
    }),
    allPipelinesKey: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'pipeline',
      context: {
        viewName: 'allPipelines',
        viewFieldName: 'key',
        fieldName: 'key',
        position: 2,
        isVisible: true,
        size: 180,
      },
    }),
    allPipelinesObjectNameSingular: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'pipeline',
      context: {
        viewName: 'allPipelines',
        viewFieldName: 'objectNameSingular',
        fieldName: 'objectNameSingular',
        position: 3,
        isVisible: true,
        size: 180,
      },
    }),
  };
};
