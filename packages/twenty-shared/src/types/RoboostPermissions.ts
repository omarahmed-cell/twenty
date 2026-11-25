export type RoboostRecordScope = 'ALL' | 'TEAM' | 'OWN' | 'NONE';

export type RoboostScopeSetting = {
  scope: RoboostRecordScope;
  includeUnassigned: boolean;
};

export type RoboostObjectSettingKey =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'merge';

export type RoboostObjectPermissions = {
  enabled: boolean;
  view?: RoboostScopeSetting;
  create?: boolean;
  edit?: RoboostScopeSetting;
  delete?: RoboostScopeSetting;
  merge?: RoboostScopeSetting;
};

export type RoboostUserPermissions = {
  objects: Record<string, RoboostObjectPermissions>;
  toggles: Record<string, boolean>;
};

export type RoboostUserRole = 'ADMIN' | 'MEMBER';

export type RoboostPermissionObjectItem = {
  kind: 'object';
  key: string;
  objectNameSingular: string;
  label: string;
  shortLabel: string;
  settings: RoboostObjectSettingKey[];
  scopeOptions: Partial<Record<RoboostObjectSettingKey, RoboostRecordScope[]>>;
  defaults: RoboostObjectPermissions;
  supportsUnassigned: boolean;
  storedOnly?: RoboostObjectSettingKey[];
  help?: string;
};

export type RoboostPermissionToggle = {
  key: string;
  label: string;
  help?: string;
  isCritical?: boolean;
  isStoredOnly?: boolean;
  defaultValue: boolean;
};

export type RoboostPermissionToggleGroupItem = {
  kind: 'toggleGroup';
  key: string;
  label: string;
  shortLabel: string;
  help?: string;
  toggles: RoboostPermissionToggle[];
};

export type RoboostPermissionItem =
  | RoboostPermissionObjectItem
  | RoboostPermissionToggleGroupItem;

export type RoboostPermissionSection = {
  id: string;
  label: string;
  description?: string;
  items: RoboostPermissionItem[];
};

export type RoboostPermissionDifference = {
  sectionLabel: string;
  itemLabel: string;
  settingKey: string;
  settingLabel: string;
  from: string;
  to: string;
};
