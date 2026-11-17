import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardServiceStageHistoryViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'serviceStageHistory'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allServiceStageHistoriesChangedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'serviceStageHistory',
      context: {
        viewName: 'allServiceStageHistories',
        viewFieldName: 'changedAt',
        fieldName: 'changedAt',
        position: 0,
        isVisible: true,
        size: 150,
      },
    }),
    allServiceStageHistoriesService: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'serviceStageHistory',
      context: {
        viewName: 'allServiceStageHistories',
        viewFieldName: 'service',
        fieldName: 'service',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allServiceStageHistoriesFromStage: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'serviceStageHistory',
      context: {
        viewName: 'allServiceStageHistories',
        viewFieldName: 'fromStage',
        fieldName: 'fromStage',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allServiceStageHistoriesToStage: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'serviceStageHistory',
      context: {
        viewName: 'allServiceStageHistories',
        viewFieldName: 'toStage',
        fieldName: 'toStage',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allServiceStageHistoriesChangedBy: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'serviceStageHistory',
      context: {
        viewName: 'allServiceStageHistories',
        viewFieldName: 'changedBy',
        fieldName: 'changedBy',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
