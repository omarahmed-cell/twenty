import { ROBOOST_PERMISSION_REGISTRY } from '@/constants/RoboostPermissionRegistry';
import {
  type RoboostObjectSettingKey,
  type RoboostPermissionDifference,
  type RoboostPermissionItem,
  type RoboostRecordScope,
  type RoboostScopeSetting,
  type RoboostUserPermissions,
} from '@/types/RoboostPermissions';
import { getRoboostPermissionObjectItems } from '@/utils/roboost-permissions/roboost-permissions-defaults';

export const ROBOOST_SCOPE_LABELS: Record<RoboostRecordScope, string> = {
  ALL: 'All',
  TEAM: "Their team's",
  OWN: 'Their own',
  NONE: 'None',
};

export const ROBOOST_SETTING_LABELS: Record<RoboostObjectSettingKey, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  merge: 'Merge',
};

export const formatRoboostScopeSetting = (
  setting: RoboostScopeSetting | undefined,
): string => {
  if (setting === undefined) {
    return 'None';
  }

  const label = ROBOOST_SCOPE_LABELS[setting.scope];

  return setting.includeUnassigned ? `${label} and Unassigned` : label;
};

// One line per card, e.g. "View (All), Create, Edit (Their own and Unassigned), Delete (None)"
export const summarizeRoboostPermissionItem = (
  item: RoboostPermissionItem,
  permissions: RoboostUserPermissions,
): string => {
  if (item.kind === 'toggleGroup') {
    const enabledLabels = item.toggles
      .filter((toggle) => permissions.toggles[toggle.key] === true)
      .map((toggle) => toggle.label);

    return enabledLabels.length > 0 ? enabledLabels.join(', ') : 'No access';
  }

  const objectPermissions = permissions.objects[item.key];

  if (objectPermissions === undefined || !objectPermissions.enabled) {
    return 'No access';
  }

  return item.settings
    .map((settingKey) => {
      if (settingKey === 'create') {
        return objectPermissions.create === true ? 'Create' : null;
      }

      return `${ROBOOST_SETTING_LABELS[settingKey]} (${formatRoboostScopeSetting(objectPermissions[settingKey])})`;
    })
    .filter((part): part is string => part !== null)
    .join(', ');
};

const ACCESS_SUMMARY_TOGGLES: { key: string; label: string }[] = [
  { key: 'import', label: 'Import' },
  { key: 'export', label: 'Export' },
  { key: 'bulkDelete', label: 'Bulk delete' },
  { key: 'workflowsEdit', label: 'Workflows' },
  { key: 'scoringEdit', label: 'Scoring' },
  { key: 'permanentDelete', label: 'Permanent delete' },
  { key: 'editPropertySettings', label: 'Properties' },
  { key: 'developerTools', label: 'Developer' },
  { key: 'userTableAccess', label: 'User table' },
];

// Short text for the Access column: "Admin", or the CRM objects they can open plus notable tools
export const summarizeRoboostAccess = ({
  isAdmin,
  permissions,
}: {
  isAdmin: boolean;
  permissions: RoboostUserPermissions;
}): string => {
  if (isAdmin) {
    return 'Admin';
  }

  const objectLabels = getRoboostPermissionObjectItems()
    .filter(
      (item) =>
        item.settings.includes('view') &&
        permissions.objects[item.key]?.enabled === true,
    )
    .map((item) => item.shortLabel);

  const toolLabels = ACCESS_SUMMARY_TOGGLES.filter(
    (toggle) => permissions.toggles[toggle.key] === true,
  ).map((toggle) => toggle.label);

  const parts = [...objectLabels, ...toolLabels];

  return parts.length > 0 ? parts.join(' · ') : 'No access';
};

const describeObjectSetting = (
  permissions: RoboostUserPermissions,
  objectKey: string,
  settingKey: RoboostObjectSettingKey | 'enabled',
): string => {
  const objectPermissions = permissions.objects[objectKey];

  if (settingKey === 'enabled') {
    return objectPermissions?.enabled === true ? 'On' : 'Off';
  }

  if (settingKey === 'create') {
    return objectPermissions?.create === true ? 'On' : 'Off';
  }

  return formatRoboostScopeSetting(objectPermissions?.[settingKey]);
};

// Every setting that differs, in registry order: used by Compare access and permission history
export const diffRoboostPermissions = (
  from: RoboostUserPermissions,
  to: RoboostUserPermissions,
): RoboostPermissionDifference[] => {
  const differences: RoboostPermissionDifference[] = [];

  for (const section of ROBOOST_PERMISSION_REGISTRY) {
    for (const item of section.items) {
      if (item.kind === 'toggleGroup') {
        for (const toggle of item.toggles) {
          const fromValue = from.toggles[toggle.key] === true;
          const toValue = to.toggles[toggle.key] === true;

          if (fromValue !== toValue) {
            differences.push({
              sectionLabel: section.label,
              itemLabel: item.label,
              settingKey: `toggles.${toggle.key}`,
              settingLabel: toggle.label,
              from: fromValue ? 'On' : 'Off',
              to: toValue ? 'On' : 'Off',
            });
          }
        }
        continue;
      }

      const settingKeys: (RoboostObjectSettingKey | 'enabled')[] = [
        'enabled',
        ...item.settings,
      ];

      for (const settingKey of settingKeys) {
        const fromValue = describeObjectSetting(from, item.key, settingKey);
        const toValue = describeObjectSetting(to, item.key, settingKey);

        if (fromValue !== toValue) {
          differences.push({
            sectionLabel: section.label,
            itemLabel: item.label,
            settingKey: `objects.${item.key}.${settingKey}`,
            settingLabel:
              settingKey === 'enabled'
                ? 'Access'
                : ROBOOST_SETTING_LABELS[settingKey],
            from: fromValue,
            to: toValue,
          });
        }
      }
    }
  }

  return differences;
};
