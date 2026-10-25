import { msg } from '@lingui/core/macro';
import {
  STANDARD_OBJECTS,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-shared/metadata';

import { PageLayoutType, WidgetType } from 'twenty-shared/types';
import {
  TAB_PROPS,
  VERTICAL_LIST_LAYOUT_POSITIONS,
  WIDGET_PROPS,
} from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-page-layout-tabs.template';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import {
  type StandardPageLayoutConfig,
  type StandardPageLayoutTabConfig,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/page-layout-config/standard-page-layout-config.type';

const LINE_ITEM_PAGE_TABS = {
  home: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.lineItemRecordPage.tabs.home
        .universalIdentifier,
    ...TAB_PROPS.home,
    widgets: {
      fields: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.lineItemRecordPage.tabs
            .home.widgets.fields.universalIdentifier,
        ...WIDGET_PROPS.fields,
      },
      product: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.lineItemRecordPage.tabs
            .home.widgets.product.universalIdentifier,
        title: i18nLabel(
          msg({ message: 'Product', context: 'pageLayoutWidget.title' }),
        ),
        type: WidgetType.FIELD,
        position: VERTICAL_LIST_LAYOUT_POSITIONS.SECOND,
        fieldUniversalIdentifier:
          STANDARD_OBJECTS.lineItem.fields.product.universalIdentifier,
      },
      deal: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.lineItemRecordPage.tabs
            .home.widgets.deal.universalIdentifier,
        title: i18nLabel(
          msg({ message: 'Deal', context: 'pageLayoutWidget.title' }),
        ),
        type: WidgetType.FIELD,
        position: VERTICAL_LIST_LAYOUT_POSITIONS.THIRD,
        fieldUniversalIdentifier:
          STANDARD_OBJECTS.lineItem.fields.deal.universalIdentifier,
      },
    },
  },
} as const satisfies Record<string, StandardPageLayoutTabConfig>;

export const STANDARD_LINE_ITEM_PAGE_LAYOUT_CONFIG = {
  name: i18nLabel(
    msg({ message: 'Default Line Item Layout', context: 'pageLayout.name' }),
  ),
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: STANDARD_OBJECTS.lineItem.universalIdentifier,
  universalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.lineItemRecordPage
      .universalIdentifier,
  defaultTabUniversalIdentifier: null,
  tabs: LINE_ITEM_PAGE_TABS,
} as const satisfies StandardPageLayoutConfig;
