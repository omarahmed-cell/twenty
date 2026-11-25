import { ROBOOST_USER_PERMISSIONS } from '@/roboost-app/users-and-teams/graphql/roboostUsersQueries';
import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import { getRoboostUsersPath } from '@/roboost-app/users-and-teams/utils/getRoboostUsersAndTeamsPath';
import { Tag } from '@/roboost-ui/components/Tag';
import { cx } from '@/roboost-ui/utils/cx';
import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ROBOOST_PERMISSION_REGISTRY } from 'twenty-shared/constants';
import { type RoboostUserPermissions } from 'twenty-shared/types';
import {
  formatRoboostScopeSetting,
  isDefined,
  normalizeRoboostPermissions,
  ROBOOST_SETTING_LABELS,
} from 'twenty-shared/utils';

type UserPermissionsQuery = {
  roboostUserPermissions: {
    workspaceMemberId: string;
    name: string;
    isAdmin: boolean;
    permissions: Partial<RoboostUserPermissions>;
  };
};

type CompareRow = {
  key: string;
  sectionLabel: string;
  label: string;
  isCritical: boolean;
};

const COMPARE_ROWS: CompareRow[] = ROBOOST_PERMISSION_REGISTRY.flatMap(
  (section) =>
    section.items.flatMap((item) =>
      item.kind === 'toggleGroup'
        ? item.toggles.map((toggle) => ({
            key: `toggles.${toggle.key}`,
            sectionLabel: section.label,
            label: `${item.label} · ${toggle.label}`,
            isCritical: toggle.isCritical === true,
          }))
        : [
            {
              key: `objects.${item.key}.enabled`,
              sectionLabel: section.label,
              label: `${item.label} · Access`,
              isCritical: false,
            },
            ...item.settings.map((settingKey) => ({
              key: `objects.${item.key}.${settingKey}`,
              sectionLabel: section.label,
              label: `${item.label} · ${ROBOOST_SETTING_LABELS[settingKey]}`,
              isCritical: settingKey === 'delete',
            })),
          ],
    ),
);

const describe = (
  permissions: RoboostUserPermissions,
  isAdmin: boolean,
  key: string,
): string => {
  if (isAdmin) {
    return 'Full access';
  }

  const [kind, itemKey, settingKey] = key.split('.');

  if (kind === 'toggles') {
    return permissions.toggles[itemKey] === true ? 'On' : 'Off';
  }

  const objectPermissions = permissions.objects[itemKey];

  if (!isDefined(objectPermissions)) {
    return '—';
  }

  if (settingKey === 'enabled') {
    return objectPermissions.enabled ? 'On' : 'Off';
  }

  if (!objectPermissions.enabled) {
    return 'No access';
  }

  if (settingKey === 'create') {
    return objectPermissions.create === true ? 'On' : 'Off';
  }

  return formatRoboostScopeSetting(
    objectPermissions[settingKey as 'view' | 'edit' | 'delete' | 'merge'],
  );
};

const useUserPermissions = (workspaceMemberId: string, skip: boolean) =>
  useQuery<UserPermissionsQuery>(ROBOOST_USER_PERMISSIONS, {
    variables: { workspaceMemberId },
    fetchPolicy: 'network-only',
    skip,
  }).data?.roboostUserPermissions;

export const RoboostCompareAccessPage = () => {
  const { t } = useLingui();
  const access = useRoboostAccess();
  const { firstWorkspaceMemberId = '', secondWorkspaceMemberId = '' } =
    useParams();
  const first = useUserPermissions(firstWorkspaceMemberId, !access.isAdmin);
  const second = useUserPermissions(secondWorkspaceMemberId, !access.isAdmin);

  if (access.isLoaded && !access.isAdmin) {
    return <Navigate to={getRoboostUsersPath()} replace />;
  }

  const users = [first, second];
  const rows = COMPARE_ROWS.map((row) => {
    const values = users.map((user) =>
      isDefined(user)
        ? describe(
            normalizeRoboostPermissions(user.permissions),
            user.isAdmin,
            row.key,
          )
        : '',
    );

    return { ...row, values, isDifferent: values[0] !== values[1] };
  });
  const differenceCount = rows.filter((row) => row.isDifferent).length;

  return (
    <div className="rb-ui rb-forms-page rb-cmp-page">
      <div className="rb-forms-crumbs">
        <Link to="/settings/profile">{t`Settings`}</Link>
        <span>/</span>
        <Link to={getRoboostUsersPath()}>{t`Users & Teams`}</Link>
        <span>/</span>
        <b>{t`Compare access`}</b>
      </div>
      <div className="rb-pe-head">
        <div>
          <h1 className="rb-forms-title">{t`Compare access`}</h1>
          <div className="rb-pe-head-sub rb-dt-muted">
            {differenceCount === 1
              ? t`1 difference, highlighted`
              : t`${differenceCount} differences, highlighted`}
          </div>
        </div>
        <span className="rb-sp" />
        <Link
          className="rb-btn rb-btn-secondary rb-btn-md"
          to={getRoboostUsersPath()}
        >
          {t`Close`}
        </Link>
      </div>
      <div className="rb-cmp-grid">
        {users.map((user, index) => (
          <div key={index} className="rb-cmp-col">
            <div className="rb-cmp-col-head">
              <span className="rb-cmp-name">{user?.name ?? '…'}</span>
              {isDefined(user) && (
                <Tag tone={user.isAdmin ? 'accent' : undefined}>
                  {user.isAdmin ? t`Admin` : t`Member`}
                </Tag>
              )}
            </div>
            {rows.map((row, rowIndex) => (
              <div key={row.key}>
                {(rowIndex === 0 ||
                  rows[rowIndex - 1].sectionLabel !== row.sectionLabel) && (
                  <div className="rb-cmp-section">{row.sectionLabel}</div>
                )}
                <div
                  className={cx(
                    'rb-cmp-row',
                    row.isDifferent && 'is-different',
                  )}
                >
                  <span className="rb-cmp-label">{row.label}</span>
                  <span className="rb-cmp-value">{row.values[index]}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
