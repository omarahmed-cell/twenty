import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardOpportunityStageHistoryViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'opportunityStageHistory'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allOpportunityStageHistoriesChangedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'opportunityStageHistory',
      context: {
        viewName: 'allOpportunityStageHistories',
        viewFieldName: 'changedAt',
        fieldName: 'changedAt',
        position: 0,
        isVisible: true,
        size: 150,
      },
    }),
    allOpportunityStageHistoriesOpportunity:
      createStandardViewFieldFlatMetadata({
        ...args,
        objectName: 'opportunityStageHistory',
        context: {
          viewName: 'allOpportunityStageHistories',
          viewFieldName: 'opportunity',
          fieldName: 'opportunity',
          position: 1,
          isVisible: true,
          size: 150,
        },
      }),
    allOpportunityStageHistoriesFromStage: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'opportunityStageHistory',
      context: {
        viewName: 'allOpportunityStageHistories',
        viewFieldName: 'fromStage',
        fieldName: 'fromStage',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allOpportunityStageHistoriesToStage: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'opportunityStageHistory',
      context: {
        viewName: 'allOpportunityStageHistories',
        viewFieldName: 'toStage',
        fieldName: 'toStage',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allOpportunityStageHistoriesChangedBy: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'opportunityStageHistory',
      context: {
        viewName: 'allOpportunityStageHistories',
        viewFieldName: 'changedBy',
        fieldName: 'changedBy',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
