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

const SERVICE_PAGE_TABS = {
  home: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs.home
        .universalIdentifier,
    ...TAB_PROPS.home,
    widgets: {
      fields: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs.home
            .widgets.fields.universalIdentifier,
        ...WIDGET_PROPS.fields,
      },
      company: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs.home
            .widgets.company.universalIdentifier,
        title: i18nLabel(
          msg({ message: 'Company', context: 'pageLayoutWidget.title' }),
        ),
        type: WidgetType.FIELD,
        position: VERTICAL_LIST_LAYOUT_POSITIONS.SECOND,
        fieldUniversalIdentifier:
          STANDARD_OBJECTS.service.fields.company.universalIdentifier,
      },
      pointOfContact: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs.home
            .widgets.pointOfContact.universalIdentifier,
        title: i18nLabel(
          msg({
            message: 'Point of Contact',
            context: 'pageLayoutWidget.title',
          }),
        ),
        type: WidgetType.FIELD,
        position: VERTICAL_LIST_LAYOUT_POSITIONS.THIRD,
        fieldUniversalIdentifier:
          STANDARD_OBJECTS.service.fields.pointOfContact.universalIdentifier,
      },
      opportunity: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs.home
            .widgets.opportunity.universalIdentifier,
        title: i18nLabel(
          msg({ message: 'Opportunity', context: 'pageLayoutWidget.title' }),
        ),
        type: WidgetType.FIELD,
        position: VERTICAL_LIST_LAYOUT_POSITIONS.FOURTH,
        fieldUniversalIdentifier:
          STANDARD_OBJECTS.service.fields.opportunity.universalIdentifier,
      },
    },
  },
  timeline: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs.timeline
        .universalIdentifier,
    ...TAB_PROPS.timeline,
    widgets: {
      timeline: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs
            .timeline.widgets.timeline.universalIdentifier,
        ...WIDGET_PROPS.timeline,
      },
    },
  },
  tasks: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs.tasks
        .universalIdentifier,
    ...TAB_PROPS.tasks,
    widgets: {
      tasks: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs
            .tasks.widgets.tasks.universalIdentifier,
        ...WIDGET_PROPS.tasks,
      },
    },
  },
  notes: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs.notes
        .universalIdentifier,
    ...TAB_PROPS.notes,
    widgets: {
      notes: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs
            .notes.widgets.notes.universalIdentifier,
        ...WIDGET_PROPS.notes,
      },
    },
  },
  emails: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs.emails
        .universalIdentifier,
    ...TAB_PROPS.emails,
    widgets: {
      emails: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs
            .emails.widgets.emails.universalIdentifier,
        ...WIDGET_PROPS.emails,
      },
    },
  },
  calendar: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs.calendar
        .universalIdentifier,
    ...TAB_PROPS.calendar,
    widgets: {
      calendar: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage.tabs
            .calendar.widgets.calendar.universalIdentifier,
        ...WIDGET_PROPS.calendar,
      },
    },
  },
} as const satisfies Record<string, StandardPageLayoutTabConfig>;

export const STANDARD_SERVICE_PAGE_LAYOUT_CONFIG = {
  name: i18nLabel(
    msg({ message: 'Default Service Layout', context: 'pageLayout.name' }),
  ),
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: STANDARD_OBJECTS.service.universalIdentifier,
  universalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.serviceRecordPage
      .universalIdentifier,
  defaultTabUniversalIdentifier: null,
  tabs: SERVICE_PAGE_TABS,
} as const satisfies StandardPageLayoutConfig;
