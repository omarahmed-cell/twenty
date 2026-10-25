import { msg } from '@lingui/core/macro';
import { ViewKey, ViewType } from 'twenty-shared/types';

import { INDEX_VIEW_NAME } from 'src/engine/metadata-modules/view/constants/index-view-name.constant';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';

import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardLineItemViews = (
  args: Omit<CreateStandardViewArgs<'lineItem'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allLineItems: createStandardViewFlatMetadata({
      ...args,
      objectName: 'lineItem',
      context: {
        viewName: 'allLineItems',
        name: INDEX_VIEW_NAME,
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconTable',
      },
    }),
    lineItemRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'lineItem',
      context: {
        viewName: 'lineItemRecordPageFields',
        name: 'Line Item Record Page Fields',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconListDetails',
      },
    }),
    // Embedded by the deal page Line of Item widget, so it must stay a TABLE_WIDGET view without the INDEX key
    dealRecordPageLineItems: createStandardViewFlatMetadata({
      ...args,
      objectName: 'lineItem',
      context: {
        viewName: 'dealRecordPageLineItems',
        name: i18nLabel(
          msg({ message: `Deal Line Items Table`, context: 'view.name' }),
        ),
        type: ViewType.TABLE_WIDGET,
        key: null,
        position: 1,
        icon: 'IconTable',
      },
    }),
  };
};
