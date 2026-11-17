import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CoreObjectNameSingular, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';
import { Section } from 'twenty-ui/components/layout';
import {
  IconFolder,
  IconListSearch,
  IconSettingsAutomation,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsTabBar } from '@/settings/components/layout/SettingsTabBar';
import { useSettingsActiveTabId } from '@/settings/components/layout/useSettingsActiveTabId';
import { SettingsPropertiesTab } from '@/settings/data-model/properties/components/SettingsPropertiesTab';
import { SettingsPropertyGroupsTab } from '@/settings/data-model/properties/components/SettingsPropertyGroupsTab';
import { SettingsPropertyLogicTab } from '@/settings/data-model/properties/components/SettingsPropertyLogicTab';
import { SETTINGS_PROPERTIES_DEFAULT_OBJECT_NAME_SINGULAR } from '@/settings/data-model/properties/constants/SettingsPropertiesDefaultObjectNameSingular';
import { SETTINGS_PROPERTIES_OBJECT_QUERY_PARAM } from '@/settings/data-model/properties/constants/SettingsPropertiesObjectQueryParam';
import { SETTINGS_PROPERTIES_TAB_IDS } from '@/settings/data-model/properties/constants/SettingsPropertiesTabIds';
import { SETTINGS_PROPERTIES_TABS_INSTANCE_ID } from '@/settings/data-model/properties/constants/SettingsPropertiesTabsInstanceId';
import { ALL_FILTER } from '@/settings/data-model/properties/utils/buildPropertyTableRows';
import { Select } from '@/ui/input/components/Select';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const StyledObjectSelect = styled.div`
  padding-bottom: ${themeCssVariables.spacing[2]};
  width: 280px;
`;

// The chosen object lives in this page's state: it survives tab switches and resets to Company when the screen is left
export const SettingsProperties = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);

  const selectableObjectMetadataItems = objectMetadataItems
    .filter(({ isActive, isSystem }) => isActive && !isSystem)
    .sort((left, right) => left.labelPlural.localeCompare(right.labelPlural));

  const hasPropertyObjects = objectMetadataItems.some(
    ({ nameSingular }) =>
      nameSingular === CoreObjectNameSingular.PropertyLogicRule,
  );

  const requestedObjectNamePlural = searchParams.get(
    SETTINGS_PROPERTIES_OBJECT_QUERY_PARAM,
  );

  const [objectMetadataId, setObjectMetadataId] = useState<string | undefined>(
    () =>
      (
        selectableObjectMetadataItems.find(
          ({ namePlural }) => namePlural === requestedObjectNamePlural,
        ) ??
        selectableObjectMetadataItems.find(
          ({ nameSingular }) =>
            nameSingular === SETTINGS_PROPERTIES_DEFAULT_OBJECT_NAME_SINGULAR,
        ) ??
        selectableObjectMetadataItems[0]
      )?.id,
  );
  const [groupFilter, setGroupFilter] = useState(ALL_FILTER);
  const [highlightedGroupId, setHighlightedGroupId] = useState<string | null>(
    null,
  );

  const objectMetadataItem = selectableObjectMetadataItems.find(
    ({ id }) => id === objectMetadataId,
  );

  const tabs = [
    {
      id: SETTINGS_PROPERTIES_TAB_IDS.properties,
      title: t`Properties`,
      Icon: IconListSearch,
    },
    {
      id: SETTINGS_PROPERTIES_TAB_IDS.conditionalLogic,
      title: t`Conditional logic`,
      Icon: IconSettingsAutomation,
    },
    {
      id: SETTINGS_PROPERTIES_TAB_IDS.groups,
      title: t`Groups`,
      Icon: IconFolder,
    },
  ];

  const activeTabId = useSettingsActiveTabId(
    SETTINGS_PROPERTIES_TABS_INSTANCE_ID,
    tabs.map(({ id }) => id),
  );

  const handleObjectChange = (nextObjectMetadataId: string) => {
    setObjectMetadataId(nextObjectMetadataId);
    setGroupFilter(ALL_FILTER);
    setHighlightedGroupId(null);
  };

  const handleShowGroup = (propertyGroupId: string) => {
    setHighlightedGroupId(propertyGroupId);
    navigate({
      search: searchParams.toString(),
      hash: SETTINGS_PROPERTIES_TAB_IDS.groups,
    });
  };

  const handleOpenGroup = (propertyGroupId: string) => {
    setGroupFilter(propertyGroupId);
    navigate({
      search: searchParams.toString(),
      hash: SETTINGS_PROPERTIES_TAB_IDS.properties,
    });
  };

  const renderActiveTab = () => {
    if (!isDefined(objectMetadataItem)) {
      return null;
    }

    switch (activeTabId) {
      case SETTINGS_PROPERTIES_TAB_IDS.conditionalLogic:
        return (
          <SettingsPropertyLogicTab
            key={objectMetadataItem.id}
            objectMetadataItem={objectMetadataItem}
          />
        );
      case SETTINGS_PROPERTIES_TAB_IDS.groups:
        return (
          <SettingsPropertyGroupsTab
            key={objectMetadataItem.id}
            objectMetadataItem={objectMetadataItem}
            highlightedGroupId={highlightedGroupId}
            onOpenGroup={handleOpenGroup}
          />
        );
      default:
        return (
          <SettingsPropertiesTab
            key={objectMetadataItem.id}
            objectMetadataItem={objectMetadataItem}
            groupFilter={groupFilter}
            onGroupFilterChange={setGroupFilter}
            onShowGroup={handleShowGroup}
          />
        );
    }
  };

  return (
    <SettingsPageLayout
      title={t`Properties`}
      secondaryBar={
        <SettingsTabBar
          aria-label={t`Properties settings`}
          tabs={tabs}
          componentInstanceId={SETTINGS_PROPERTIES_TABS_INSTANCE_ID}
        />
      }
      links={[
        { children: t`Workspace` },
        {
          children: t`Data model`,
          href: getSettingsPath(SettingsPath.Objects),
        },
        { children: t`Properties` },
      ]}
    >
      <SettingsPageContainer>
        {hasPropertyObjects ? (
          <>
            <StyledObjectSelect>
              <Select
                dropdownId="settings-properties-object-select"
                label={t`Object`}
                options={selectableObjectMetadataItems.map(
                  ({ id, labelPlural }) => ({ label: labelPlural, value: id }),
                )}
                value={objectMetadataId}
                withSearchInput
                fullWidth
                onChange={handleObjectChange}
              />
            </StyledObjectSelect>
            {renderActiveTab()}
          </>
        ) : (
          <Section.Root>
            <Section.Header
              title={t`Properties`}
              description={t`This workspace has not been upgraded for properties yet.`}
            />
          </Section.Root>
        )}
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
