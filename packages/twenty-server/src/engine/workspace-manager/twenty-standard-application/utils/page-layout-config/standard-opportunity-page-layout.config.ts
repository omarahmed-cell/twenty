import { msg } from '@lingui/core/macro';
import {
  STANDARD_OBJECTS,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-shared/metadata';

import { PageLayoutType, WidgetType } from 'twenty-shared/types';
import { FieldDisplayMode } from 'src/engine/metadata-modules/page-layout-widget/enums/field-display-mode.enum';
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

const OPPORTUNITY_PAGE_TABS = {
  home: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs.home
        .universalIdentifier,
    ...TAB_PROPS.home,
    widgets: {
      fields: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .home.widgets.fields.universalIdentifier,
        ...WIDGET_PROPS.fields,
      },
      pointOfContact: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .home.widgets.pointOfContact.universalIdentifier,
        title: 'Point of Contact',
        type: WidgetType.FIELD,
        position: VERTICAL_LIST_LAYOUT_POSITIONS.SECOND,
        fieldUniversalIdentifier:
          STANDARD_OBJECTS.opportunity.fields.pointOfContact
            .universalIdentifier,
      },
      company: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .home.widgets.company.universalIdentifier,
        title: 'Company',
        type: WidgetType.FIELD,
        position: VERTICAL_LIST_LAYOUT_POSITIONS.THIRD,
        fieldUniversalIdentifier:
          STANDARD_OBJECTS.opportunity.fields.company.universalIdentifier,
      },
      owner: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .home.widgets.owner.universalIdentifier,
        title: 'Owner',
        type: WidgetType.FIELD,
        position: VERTICAL_LIST_LAYOUT_POSITIONS.FOURTH,
        fieldUniversalIdentifier:
          STANDARD_OBJECTS.opportunity.fields.owner.universalIdentifier,
      },
      services: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .home.widgets.services.universalIdentifier,
        title: i18nLabel(
          msg({ message: 'Services', context: 'pageLayoutWidget.title' }),
        ),
        type: WidgetType.FIELD,
        position: VERTICAL_LIST_LAYOUT_POSITIONS.FIFTH,
        fieldUniversalIdentifier:
          STANDARD_OBJECTS.opportunity.fields.services.universalIdentifier,
      },
      contacts: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .home.widgets.contacts.universalIdentifier,
        title: i18nLabel(
          msg({ message: 'Contacts', context: 'pageLayoutWidget.title' }),
        ),
        type: WidgetType.FIELD,
        position: VERTICAL_LIST_LAYOUT_POSITIONS.SIXTH,
        fieldUniversalIdentifier:
          STANDARD_OBJECTS.opportunity.fields.contacts.universalIdentifier,
      },
    },
  },
  lineItems: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
        .lineItems.universalIdentifier,
    ...TAB_PROPS.lineItems,
    widgets: {
      lineItems: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .lineItems.widgets.lineItems.universalIdentifier,
        title: i18nLabel(
          msg({ message: 'Line of Item', context: 'pageLayoutWidget.title' }),
        ),
        type: WidgetType.FIELD,
        position: VERTICAL_LIST_LAYOUT_POSITIONS.FIRST,
        fieldUniversalIdentifier:
          STANDARD_OBJECTS.opportunity.fields.lineItems.universalIdentifier,
        fieldDisplayMode: FieldDisplayMode.TABLE,
        embeddedViewUniversalIdentifier:
          STANDARD_OBJECTS.lineItem.views.dealRecordPageLineItems
            .universalIdentifier,
      },
    },
  },
  timeline: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
        .timeline.universalIdentifier,
    ...TAB_PROPS.timeline,
    widgets: {
      timeline: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .timeline.widgets.timeline.universalIdentifier,
        ...WIDGET_PROPS.timeline,
      },
    },
  },
  tasks: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
        .tasks.universalIdentifier,
    ...TAB_PROPS.tasks,
    widgets: {
      tasks: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .tasks.widgets.tasks.universalIdentifier,
        ...WIDGET_PROPS.tasks,
      },
    },
  },
  notes: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
        .notes.universalIdentifier,
    ...TAB_PROPS.notes,
    widgets: {
      notes: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .notes.widgets.notes.universalIdentifier,
        ...WIDGET_PROPS.notes,
      },
    },
  },
  calls: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
        .calls.universalIdentifier,
    ...TAB_PROPS.calls,
    widgets: {
      calls: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .calls.widgets.calls.universalIdentifier,
        ...WIDGET_PROPS.calls,
      },
    },
  },
  communications: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
        .communications.universalIdentifier,
    ...TAB_PROPS.communications,
    widgets: {
      communications: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .communications.widgets.communications.universalIdentifier,
        ...WIDGET_PROPS.communications,
      },
    },
  },
  files: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
        .files.universalIdentifier,
    ...TAB_PROPS.files,
    widgets: {
      files: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .files.widgets.files.universalIdentifier,
        ...WIDGET_PROPS.files,
      },
    },
  },
  emails: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
        .emails.universalIdentifier,
    ...TAB_PROPS.emails,
    widgets: {
      emails: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .emails.widgets.emails.universalIdentifier,
        ...WIDGET_PROPS.emails,
      },
    },
  },
  conversations: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
        .conversations.universalIdentifier,
    ...TAB_PROPS.conversations,
    widgets: {
      conversations: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .conversations.widgets.conversations.universalIdentifier,
        ...WIDGET_PROPS.conversations,
      },
    },
  },
  calendar: {
    universalIdentifier:
      STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
        .calendar.universalIdentifier,
    ...TAB_PROPS.calendar,
    widgets: {
      calendar: {
        universalIdentifier:
          STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
            .calendar.widgets.calendar.universalIdentifier,
        ...WIDGET_PROPS.calendar,
      },
    },
  },
} as const satisfies Record<string, StandardPageLayoutTabConfig>;

export const STANDARD_OPPORTUNITY_PAGE_LAYOUT_CONFIG = {
  name: 'Default Opportunity Layout',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: STANDARD_OBJECTS.opportunity.universalIdentifier,
  universalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage
      .universalIdentifier,
  defaultTabUniversalIdentifier: null,
  tabs: OPPORTUNITY_PAGE_TABS,
} as const satisfies StandardPageLayoutConfig;
