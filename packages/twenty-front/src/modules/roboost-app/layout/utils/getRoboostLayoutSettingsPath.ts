export const ROBOOST_LAYOUT_SETTINGS_PATH = '/settings/roboost-layout';

export const getRoboostFormsSettingsPath = (objectNameSingular?: string) =>
  `${ROBOOST_LAYOUT_SETTINGS_PATH}/forms${
    objectNameSingular !== undefined ? `/${objectNameSingular}` : ''
  }`;

export const getRoboostRecordViewSettingsPath = (objectNameSingular?: string) =>
  `${ROBOOST_LAYOUT_SETTINGS_PATH}/record-view${
    objectNameSingular !== undefined ? `/${objectNameSingular}` : ''
  }`;
