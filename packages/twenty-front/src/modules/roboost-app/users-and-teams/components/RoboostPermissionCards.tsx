import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { Select } from '@/roboost-ui/components/Select';
import { Tag } from '@/roboost-ui/components/Tag';
import { Toggle } from '@/roboost-ui/components/Toggle';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { ROBOOST_OWNERSHIP_FIELDS } from 'twenty-shared/constants';
import {
  type RoboostObjectPermissions,
  type RoboostObjectSettingKey,
  type RoboostPermissionObjectItem,
  type RoboostPermissionToggleGroupItem,
  type RoboostRecordScope,
  type RoboostUserPermissions,
} from 'twenty-shared/types';
import {
  isDefined,
  ROBOOST_SCOPE_LABELS,
  ROBOOST_SETTING_LABELS,
  summarizeRoboostPermissionItem,
} from 'twenty-shared/utils';

type RoboostPermissionCardFrameProps = {
  title: string;
  summary: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  isEnabled: boolean;
  isReadOnly: boolean;
  onEnabledChange: (isEnabled: boolean) => void;
  children: React.ReactNode;
};

const RoboostPermissionCardFrame = ({
  title,
  summary,
  isExpanded,
  onToggleExpanded,
  isEnabled,
  isReadOnly,
  onEnabledChange,
  children,
}: RoboostPermissionCardFrameProps) => {
  const { t } = useLingui();

  return (
    <section className={cx('rb-pe-card', isExpanded && 'is-expanded')}>
      <div className="rb-pe-card-head">
        <button
          type="button"
          className="rb-pe-card-toggle"
          aria-expanded={isExpanded}
          onClick={onToggleExpanded}
        >
          <Icon name={isExpanded ? 'chevron-up' : 'caret'} size={14} />
          <span className="rb-pe-card-title">{title}</span>
          <span className="rb-pe-card-summary">{summary}</span>
        </button>
        <span className="rb-pe-master">
          <span className="rb-dt-muted">{isEnabled ? t`On` : t`Off`}</span>
          <Toggle
            aria-label={t`${title} on or off`}
            checked={isEnabled}
            disabled={isReadOnly}
            onChange={onEnabledChange}
          />
        </span>
      </div>
      {isExpanded && <div className="rb-pe-card-body">{children}</div>}
    </section>
  );
};

type RoboostPermissionSettingRowProps = {
  label: string;
  help?: string;
  isCritical?: boolean;
  isStoredOnly?: boolean;
  children: React.ReactNode;
};

const RoboostPermissionSettingRow = ({
  label,
  help,
  isCritical,
  isStoredOnly,
  children,
}: RoboostPermissionSettingRowProps) => {
  const { t } = useLingui();

  return (
    <div className="rb-pe-row">
      <div className="rb-pe-row-label">
        <span>{label}</span>
        {isCritical === true && <Tag tone="danger">{t`Critical`}</Tag>}
        {isStoredOnly === true && (
          <span
            className="rb-pe-later"
            title={t`Saved now; applied when this module is built`}
          >
            {t`Applied later`}
          </span>
        )}
        {isDefined(help) && <p className="rb-pe-row-help">{help}</p>}
      </div>
      <div className="rb-pe-row-control">{children}</div>
    </div>
  );
};

type RoboostPermissionObjectCardProps = {
  item: RoboostPermissionObjectItem;
  permissions: RoboostUserPermissions;
  isExpanded: boolean;
  isReadOnly: boolean;
  searchTerm: string;
  onToggleExpanded: () => void;
  onChange: (objectPermissions: RoboostObjectPermissions) => void;
};

export const RoboostPermissionObjectCard = ({
  item,
  permissions,
  isExpanded,
  isReadOnly,
  searchTerm,
  onToggleExpanded,
  onChange,
}: RoboostPermissionObjectCardProps) => {
  const { t } = useLingui();
  const objectPermissions = permissions.objects[item.key];
  const ownershipFields = ROBOOST_OWNERSHIP_FIELDS[item.objectNameSingular];
  const isEnabled = objectPermissions?.enabled === true;

  if (!isDefined(objectPermissions)) {
    return null;
  }

  const update = (patch: Partial<RoboostObjectPermissions>) =>
    onChange({ ...objectPermissions, ...patch });

  const scopeLabel = (scope: RoboostRecordScope) => {
    const objectLabel = item.label.toLowerCase();

    switch (scope) {
      case 'ALL':
        return t`All ${objectLabel}`;
      case 'TEAM':
        return t`Their team's ${objectLabel}`;
      case 'OWN':
        return t`Their own ${objectLabel}`;
      case 'NONE':
        return t`None`;
    }
  };

  const settingKeys = item.settings.filter(
    (settingKey) =>
      searchTerm === '' ||
      item.label.toLowerCase().includes(searchTerm) ||
      ROBOOST_SETTING_LABELS[settingKey].toLowerCase().includes(searchTerm),
  );

  const renderScopeSetting = (
    settingKey: Exclude<RoboostObjectSettingKey, 'create'>,
  ) => {
    const setting = objectPermissions[settingKey];
    const scopes = item.scopeOptions[settingKey] ?? [];

    if (!isDefined(setting)) {
      return null;
    }

    const canIncludeUnassigned =
      item.supportsUnassigned &&
      (setting.scope === 'OWN' || setting.scope === 'TEAM');

    return (
      <RoboostPermissionSettingRow
        key={settingKey}
        label={ROBOOST_SETTING_LABELS[settingKey]}
        isCritical={settingKey === 'delete'}
        isStoredOnly={item.storedOnly?.includes(settingKey)}
      >
        <Select
          aria-label={t`${item.label} ${ROBOOST_SETTING_LABELS[settingKey]}`}
          value={setting.scope}
          options={scopes.map((scope) => ({
            value: scope,
            label: scopeLabel(scope),
          }))}
          onChange={(value) => {
            if (isReadOnly) {
              return;
            }
            const scope = value as RoboostRecordScope;

            update({
              [settingKey]: {
                scope,
                includeUnassigned:
                  item.supportsUnassigned &&
                  (scope === 'OWN' || scope === 'TEAM')
                    ? setting.includeUnassigned
                    : false,
              },
            });
          }}
        />
        {canIncludeUnassigned && (
          <Checkbox
            checked={setting.includeUnassigned}
            disabled={isReadOnly}
            onChange={(checked) =>
              update({
                [settingKey]: { ...setting, includeUnassigned: checked },
              })
            }
          >
            {t`Unassigned`}
          </Checkbox>
        )}
      </RoboostPermissionSettingRow>
    );
  };

  return (
    <RoboostPermissionCardFrame
      title={item.label}
      summary={summarizeRoboostPermissionItem(item, permissions)}
      isExpanded={isExpanded}
      onToggleExpanded={onToggleExpanded}
      isEnabled={isEnabled}
      isReadOnly={isReadOnly}
      onEnabledChange={(enabled) => update({ enabled })}
    >
      {isDefined(item.help) && <p className="rb-pe-help">{item.help}</p>}
      {isDefined(ownershipFields) && (
        <p className="rb-pe-help">
          {t`"Their" records: ${ownershipFields
            .map((field) => field.label)
            .join(
              ' or ',
            )} is the user (or, for their team's, anyone in their teams). Unassigned: every one of these fields is empty.`}
        </p>
      )}
      {!isEnabled && (
        <p className="rb-pe-help">{t`Off: no access to ${item.label.toLowerCase()} at all.`}</p>
      )}
      <div className={cx('rb-pe-rows', !isEnabled && 'is-disabled')}>
        {settingKeys.map((settingKey) =>
          settingKey === 'create' ? (
            <RoboostPermissionSettingRow key="create" label={t`Create`}>
              <Toggle
                aria-label={t`${item.label} Create`}
                checked={objectPermissions.create === true}
                disabled={isReadOnly || !isEnabled}
                onChange={(create) => update({ create })}
              />
            </RoboostPermissionSettingRow>
          ) : (
            renderScopeSetting(settingKey)
          ),
        )}
      </div>
    </RoboostPermissionCardFrame>
  );
};

type RoboostPermissionToggleCardProps = {
  item: RoboostPermissionToggleGroupItem;
  permissions: RoboostUserPermissions;
  isExpanded: boolean;
  isReadOnly: boolean;
  searchTerm: string;
  onToggleExpanded: () => void;
  onChange: (toggles: Record<string, boolean>) => void;
};

export const RoboostPermissionToggleCard = ({
  item,
  permissions,
  isExpanded,
  isReadOnly,
  searchTerm,
  onToggleExpanded,
  onChange,
}: RoboostPermissionToggleCardProps) => {
  const isAnyOn = item.toggles.some(
    (toggle) => permissions.toggles[toggle.key] === true,
  );
  const visibleToggles = item.toggles.filter(
    (toggle) =>
      searchTerm === '' ||
      item.label.toLowerCase().includes(searchTerm) ||
      toggle.label.toLowerCase().includes(searchTerm) ||
      (toggle.help ?? '').toLowerCase().includes(searchTerm),
  );

  return (
    <RoboostPermissionCardFrame
      title={item.label}
      summary={summarizeRoboostPermissionItem(item, permissions)}
      isExpanded={isExpanded}
      onToggleExpanded={onToggleExpanded}
      isEnabled={isAnyOn}
      isReadOnly={isReadOnly}
      onEnabledChange={(isOn) =>
        onChange(
          Object.fromEntries(item.toggles.map((toggle) => [toggle.key, isOn])),
        )
      }
    >
      {isDefined(item.help) && <p className="rb-pe-help">{item.help}</p>}
      <div className="rb-pe-rows">
        {visibleToggles.map((toggle) => (
          <RoboostPermissionSettingRow
            key={toggle.key}
            label={toggle.label}
            help={toggle.help}
            isCritical={toggle.isCritical}
            isStoredOnly={toggle.isStoredOnly}
          >
            <Toggle
              aria-label={toggle.label}
              checked={permissions.toggles[toggle.key] === true}
              disabled={isReadOnly}
              onChange={(isOn) => onChange({ [toggle.key]: isOn })}
            />
          </RoboostPermissionSettingRow>
        ))}
      </div>
    </RoboostPermissionCardFrame>
  );
};

export const ROBOOST_SCOPE_OPTION_LABELS = ROBOOST_SCOPE_LABELS;
