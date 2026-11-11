import { msg } from '@lingui/core/macro';
import {
  STANDARD_OBJECTS,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-shared/metadata';

import { PageLayoutType } from 'twenty-shared/types';
import {
  CONDITIONAL_AVAILABILITY_EXPRESSION_DEVICE_DESKTOP,
  CONDITIONAL_AVAILABILITY_EXPRESSION_DEVICE_MOBILE,
  CONDITIONAL_DISPLAY_DEVICE_DESKTOP,
  CONDITIONAL_DISPLAY_DEVICE_MOBILE,
  TAB_PROPS,
  WIDGET_PROPS,
} from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-page-layout-tabs.template';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import {
  type StandardPageLayoutConfig,
  type StandardPageLayoutTabConfig,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/page-layout-config/standard-page-layout-config.type';

const EMAIL_PAGE_TABS = {
  home: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.emailRecordPage.tabs.home
        .universalIdentifier,
    ...TAB_PROPS.home,
    widgets: {
      fields: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.emailRecordPage.tabs.home
            .widgets.fields.universalIdentifier,
        ...WIDGET_PROPS.fields,
      },
      emailRichText: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.emailRecordPage.tabs.home
            .widgets.emailRichText.universalIdentifier,
        title: i18nLabel(
          msg({ message: 'Email', context: 'pageLayoutWidget.title' }),
        ),
        type: WIDGET_PROPS.noteRichText.type,
        position: { layoutMode: TAB_PROPS.home.layoutMode, index: 1 },
        conditionalDisplay: CONDITIONAL_DISPLAY_DEVICE_MOBILE,
        conditionalAvailabilityExpression:
          CONDITIONAL_AVAILABILITY_EXPRESSION_DEVICE_MOBILE,
      },
    },
  },
  email: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.emailRecordPage.tabs.email
        .universalIdentifier,
    title: i18nLabel(msg({ message: 'Email', context: 'pageLayoutTab.title' })),
    position: TAB_PROPS.note.position,
    icon: 'IconMessageCircle',
    layoutMode: TAB_PROPS.note.layoutMode,
    widgets: {
      emailRichText: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.emailRecordPage.tabs.email
            .widgets.emailRichText.universalIdentifier,
        ...WIDGET_PROPS.noteRichText,
        title: i18nLabel(
          msg({ message: 'Email', context: 'pageLayoutWidget.title' }),
        ),
        conditionalDisplay: CONDITIONAL_DISPLAY_DEVICE_DESKTOP,
        conditionalAvailabilityExpression:
          CONDITIONAL_AVAILABILITY_EXPRESSION_DEVICE_DESKTOP,
      },
    },
  },
} as const satisfies Record<string, StandardPageLayoutTabConfig>;

export const STANDARD_EMAIL_PAGE_LAYOUT_CONFIG = {
  name: i18nLabel(
    msg({
      message: 'Default Email Layout',
      context: 'pageLayout.name',
    }),
  ),
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: STANDARD_OBJECTS.email.universalIdentifier,
  universalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.emailRecordPage
      .universalIdentifier,
  defaultTabUniversalIdentifier: null,
  tabs: EMAIL_PAGE_TABS,
} as const satisfies StandardPageLayoutConfig;
