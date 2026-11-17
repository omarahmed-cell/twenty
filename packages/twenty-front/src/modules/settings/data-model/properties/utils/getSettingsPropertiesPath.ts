import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

import { SETTINGS_PROPERTIES_OBJECT_QUERY_PARAM } from '@/settings/data-model/properties/constants/SettingsPropertiesObjectQueryParam';

export const getSettingsPropertiesPath = ({
  objectNamePlural,
  tabId,
}: {
  objectNamePlural: string;
  tabId?: string;
}) =>
  getSettingsPath(
    SettingsPath.Properties,
    undefined,
    { [SETTINGS_PROPERTIES_OBJECT_QUERY_PARAM]: objectNamePlural },
    tabId,
  );
