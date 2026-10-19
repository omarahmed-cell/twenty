import { ViewKey, ViewType } from 'twenty-shared/types';

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
