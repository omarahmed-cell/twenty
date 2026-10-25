import { ViewFilterOperand } from 'twenty-shared/types';

import { type FlatViewFilter } from 'src/engine/metadata-modules/flat-view-filter/types/flat-view-filter.type';
import {
  createStandardViewFilterFlatMetadata,
  type CreateStandardViewFilterArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-filter/create-standard-view-filter-flat-metadata.util';

export const computeStandardLineItemViewFilters = (
  args: Omit<CreateStandardViewFilterArgs<'lineItem'>, 'context'>,
): Record<string, FlatViewFilter> => {
  return {
    dealRecordPageLineItemsDealIsCurrentRecord:
      createStandardViewFilterFlatMetadata({
        ...args,
        objectName: 'lineItem',
        context: {
          viewName: 'dealRecordPageLineItems',
          viewFilterName: 'dealIsCurrentRecord',
          fieldName: 'deal',
          operand: ViewFilterOperand.IS,
          value: JSON.stringify({
            selectedRecordIds: [],
            isCurrentRecordSelected: true,
          }),
        },
      }),
  };
};
