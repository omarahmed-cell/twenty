import { msg } from '@lingui/core/macro';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import { AggregateOperations, ViewKey, ViewType } from 'twenty-shared/types';

import { INDEX_VIEW_NAME } from 'src/engine/metadata-modules/view/constants/index-view-name.constant';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';

import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardServiceViews = (
  args: Omit<CreateStandardViewArgs<'service'>, 'context'>,
): Record<string, FlatView> => {
  return {
    // Sorts ahead of the index view so the board is the first view
    servicesBoard: createStandardViewFlatMetadata({
      ...args,
      objectName: 'service',
      context: {
        viewName: 'servicesBoard',
        name: i18nLabel(
          msg({ message: `Services board`, context: 'view.name' }),
        ),
        type: ViewType.KANBAN,
        key: null,
        position: -1,
        icon: 'IconLayoutKanban',
        mainGroupByFieldName: 'stage',
        kanbanAggregateOperation: AggregateOperations.COUNT,
      },
    }),
    allServices: createStandardViewFlatMetadata({
      ...args,
      objectName: 'service',
      context: {
        viewName: 'allServices',
        name: INDEX_VIEW_NAME,
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconTable',
      },
    }),
    serviceRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'service',
      context: {
        viewName: 'serviceRecordPageFields',
        name: 'Service Record Page Fields',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconListDetails',
      },
    }),
  };
};
