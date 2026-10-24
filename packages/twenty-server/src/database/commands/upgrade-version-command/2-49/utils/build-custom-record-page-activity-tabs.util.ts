import {
  getSystemPageLayoutTabUniversalIdentifier,
  getSystemPageLayoutWidgetUniversalIdentifier,
  getSystemRecordPageLayoutUniversalIdentifier,
} from 'twenty-shared/application';
import { PageLayoutTabLayoutMode, WidgetType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type AllFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-maps.type';
import { WidgetConfigurationType } from 'src/engine/metadata-modules/page-layout-widget/enums/widget-configuration-type.type';
import { type UniversalFlatPageLayoutTab } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-page-layout-tab.type';
import { type UniversalFlatPageLayoutWidget } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-page-layout-widget.type';

// Frozen copy of what object creation emits for these two tabs today
const ACTIVITY_TAB_DEFINITIONS = [
  {
    title: 'Calls',
    position: 44,
    icon: 'IconPhone',
    widgetType: WidgetType.CALLS,
    configurationType: WidgetConfigurationType.CALLS,
  },
  {
    title: 'Communications',
    position: 47,
    icon: 'IconMessageCircle',
    widgetType: WidgetType.COMMUNICATIONS,
    configurationType: WidgetConfigurationType.COMMUNICATIONS,
  },
] as const;

export type CustomRecordPageActivityTabs = {
  pageLayoutTabs: UniversalFlatPageLayoutTab[];
  pageLayoutWidgets: UniversalFlatPageLayoutWidget[];
};

// Tabs are added to the system record page only; a caller-defined layout is left as authored
export const buildCustomRecordPageActivityTabs = ({
  flatObjectMetadataMaps,
  flatPageLayoutMaps,
  flatPageLayoutTabMaps,
  flatPageLayoutWidgetMaps,
  twentyStandardApplicationUniversalIdentifier,
  now,
}: Pick<
  AllFlatEntityMaps,
  | 'flatObjectMetadataMaps'
  | 'flatPageLayoutMaps'
  | 'flatPageLayoutTabMaps'
  | 'flatPageLayoutWidgetMaps'
> & {
  twentyStandardApplicationUniversalIdentifier: string;
  now: string;
}): Map<string, CustomRecordPageActivityTabs> => {
  const tabsByApplicationUniversalIdentifier = new Map<
    string,
    CustomRecordPageActivityTabs
  >();

  const existingTabs = Object.values(
    flatPageLayoutTabMaps.byUniversalIdentifier,
  ).filter(isDefined);
  const existingWidgets = Object.values(
    flatPageLayoutWidgetMaps.byUniversalIdentifier,
  ).filter(isDefined);

  for (const flatObjectMetadata of Object.values(
    flatObjectMetadataMaps.byUniversalIdentifier,
  ).filter(isDefined)) {
    if (
      flatObjectMetadata.applicationUniversalIdentifier ===
        twentyStandardApplicationUniversalIdentifier ||
      flatObjectMetadata.isSystem
    ) {
      continue;
    }

    const pageLayout =
      flatPageLayoutMaps.byUniversalIdentifier[
        getSystemRecordPageLayoutUniversalIdentifier({
          objectMetadataApplicationUniversalIdentifier:
            flatObjectMetadata.applicationUniversalIdentifier,
          objectUniversalIdentifier: flatObjectMetadata.universalIdentifier,
        })
      ];

    if (!isDefined(pageLayout) || isDefined(pageLayout.deletedAt)) {
      continue;
    }

    const layoutTabUniversalIdentifiers = new Set(
      existingTabs
        .filter(
          (tab) =>
            tab.pageLayoutUniversalIdentifier ===
              pageLayout.universalIdentifier && !isDefined(tab.deletedAt),
        )
        .map((tab) => tab.universalIdentifier),
    );
    const layoutWidgetTypes = new Set<string>(
      existingWidgets
        .filter(
          (widget) =>
            layoutTabUniversalIdentifiers.has(
              widget.pageLayoutTabUniversalIdentifier,
            ) && !isDefined(widget.deletedAt),
        )
        .map((widget) => widget.type),
    );

    const applicationUniversalIdentifier =
      pageLayout.applicationUniversalIdentifier;

    for (const definition of ACTIVITY_TAB_DEFINITIONS) {
      if (layoutWidgetTypes.has(definition.widgetType)) {
        continue;
      }

      const tabUniversalIdentifier = getSystemPageLayoutTabUniversalIdentifier({
        objectMetadataApplicationUniversalIdentifier:
          applicationUniversalIdentifier,
        pageLayoutUniversalIdentifier: pageLayout.universalIdentifier,
        title: definition.title,
      });

      if (
        isDefined(
          flatPageLayoutTabMaps.byUniversalIdentifier[tabUniversalIdentifier],
        )
      ) {
        continue;
      }

      const widgetUniversalIdentifier =
        getSystemPageLayoutWidgetUniversalIdentifier({
          objectMetadataApplicationUniversalIdentifier:
            applicationUniversalIdentifier,
          pageLayoutTabUniversalIdentifier: tabUniversalIdentifier,
          title: definition.title,
        });

      const activityTabs = tabsByApplicationUniversalIdentifier.get(
        applicationUniversalIdentifier,
      ) ?? { pageLayoutTabs: [], pageLayoutWidgets: [] };

      activityTabs.pageLayoutTabs.push({
        universalIdentifier: tabUniversalIdentifier,
        applicationUniversalIdentifier,
        title: definition.title,
        position: definition.position,
        pageLayoutUniversalIdentifier: pageLayout.universalIdentifier,
        widgetUniversalIdentifiers: [widgetUniversalIdentifier],
        isActive: true,
        isSystemSideEffect: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        icon: definition.icon,
        layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
        overrides: null,
      });

      activityTabs.pageLayoutWidgets.push({
        universalIdentifier: widgetUniversalIdentifier,
        applicationUniversalIdentifier,
        pageLayoutTabUniversalIdentifier: tabUniversalIdentifier,
        title: definition.title,
        type: definition.widgetType,
        position: {
          layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
          index: 0,
        },
        universalConfiguration: {
          configurationType: definition.configurationType,
        },
        objectMetadataUniversalIdentifier:
          flatObjectMetadata.universalIdentifier,
        isActive: true,
        isSystemSideEffect: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        conditionalDisplay: null,
        universalOverrides: null,
      } as UniversalFlatPageLayoutWidget);

      tabsByApplicationUniversalIdentifier.set(
        applicationUniversalIdentifier,
        activityTabs,
      );
    }
  }

  return tabsByApplicationUniversalIdentifier;
};
