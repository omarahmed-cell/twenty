import { RoboostConfirmModal } from '@/roboost-app/users-and-teams/components/RoboostConfirmModal';
import {
  RoboostPermissionObjectCard,
  RoboostPermissionToggleCard,
} from '@/roboost-app/users-and-teams/components/RoboostPermissionCards';
import {
  ROBOOST_SAVE_USER_PERMISSIONS,
  ROBOOST_USER_PERMISSIONS,
  ROBOOST_USERS,
} from '@/roboost-app/users-and-teams/graphql/roboostUsersQueries';
import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import { getRoboostUsersPath } from '@/roboost-app/users-and-teams/utils/getRoboostUsersAndTeamsPath';
import { Button } from '@/roboost-ui/components/Button';
import { Input } from '@/roboost-ui/components/Input';
import { Tag } from '@/roboost-ui/components/Tag';
import { cx } from '@/roboost-ui/utils/cx';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ROBOOST_PERMISSION_REGISTRY } from 'twenty-shared/constants';
import { type RoboostUserPermissions } from 'twenty-shared/types';
import { isDefined, normalizeRoboostPermissions } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

type UserPermissionsQuery = {
  roboostUserPermissions: {
    workspaceMemberId: string;
    name: string;
    isAdmin: boolean;
    permissions: Partial<RoboostUserPermissions>;
  };
};

const itemMatches = (labels: string[], searchTerm: string): boolean =>
  searchTerm === '' ||
  labels.some((label) => label.toLowerCase().includes(searchTerm));

export const RoboostEditPermissionsPage = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { enqueueToast } = useToast();
  const { workspaceMemberId = '' } = useParams();
  const access = useRoboostAccess();
  const { data, loading } = useQuery<UserPermissionsQuery>(
    ROBOOST_USER_PERMISSIONS,
    {
      variables: { workspaceMemberId },
      fetchPolicy: 'network-only',
      skip: !access.isAdmin,
    },
  );
  const [savePermissions] = useMutation(ROBOOST_SAVE_USER_PERMISSIONS, {
    refetchQueries: [ROBOOST_USERS],
  });
  const [draft, setDraft] = useState<RoboostUserPermissions | null>(null);
  const [search, setSearch] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [activeSectionId, setActiveSectionId] = useState(
    ROBOOST_PERMISSION_REGISTRY[0].id,
  );
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (access.isLoaded && !access.isAdmin) {
    return <Navigate to={getRoboostUsersPath()} replace />;
  }

  const target = data?.roboostUserPermissions;
  const saved = isDefined(target)
    ? normalizeRoboostPermissions(target.permissions)
    : null;
  const permissions = draft ?? saved;
  const isDirty =
    isDefined(draft) &&
    isDefined(saved) &&
    JSON.stringify(draft) !== JSON.stringify(saved);
  const isReadOnly = target?.isAdmin === true;
  const searchTerm = search.trim().toLowerCase();
  const targetName = target?.name ?? '';

  const update = (
    recipe: (current: RoboostUserPermissions) => RoboostUserPermissions,
  ) => {
    if (!isDefined(permissions) || isReadOnly) {
      return;
    }
    setDraft(recipe(permissions));
  };

  const toggleExpanded = (key: string) =>
    setExpandedKeys((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });

  const allItemKeys = ROBOOST_PERMISSION_REGISTRY.flatMap((section) =>
    section.items.map((item) => item.key),
  );
  const isAllExpanded = allItemKeys.every((key) => expandedKeys.has(key));

  const visibleSections = ROBOOST_PERMISSION_REGISTRY.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      itemMatches(
        [
          section.label,
          item.label,
          ...(item.kind === 'toggleGroup'
            ? item.toggles.flatMap((toggle) => [
                toggle.label,
                toggle.help ?? '',
              ])
            : item.settings),
        ],
        searchTerm,
      ),
    ),
  })).filter((section) => section.items.length > 0);

  const leave = () => {
    setDraft(null);
    navigate(getRoboostUsersPath(), { replace: true });
  };

  return (
    <div className="rb-ui rb-forms-page rb-pe-page">
      <div className="rb-forms-crumbs">
        <Link to="/settings/profile">{t`Settings`}</Link>
        <span>/</span>
        <Link to={getRoboostUsersPath()}>{t`Users & Teams`}</Link>
        <span>/</span>
        <b>{t`Edit permissions`}</b>
      </div>
      <div className="rb-pe-head">
        <div>
          <h1 className="rb-forms-title">
            {targetName || t`Edit permissions`}
          </h1>
          {isDefined(target) && (
            <div className="rb-pe-head-sub">
              <Tag tone={target.isAdmin ? 'accent' : undefined}>
                {target.isAdmin ? t`Admin` : t`Member`}
              </Tag>
              {isDirty && (
                <span className="rb-dt-muted">{t`Unsaved changes`}</span>
              )}
            </div>
          )}
        </div>
        <span className="rb-sp" />
        <Button
          variant="secondary"
          onClick={() => (isDirty ? setIsDiscardOpen(true) : leave())}
        >
          {t`Cancel`}
        </Button>
        <Button
          variant="primary"
          disabled={!isDirty || isSaving || isReadOnly}
          onClick={async () => {
            if (!isDefined(draft)) {
              return;
            }
            setIsSaving(true);
            try {
              await savePermissions({
                variables: { workspaceMemberId, permissions: draft },
              });
              enqueueToast({
                status: 'success',
                children: t`Permissions saved for ${targetName}`,
              });
              setDraft(null);
              leave();
            } catch (error) {
              enqueueToast({
                status: 'error',
                children:
                  error instanceof Error ? error.message : String(error),
              });
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {t`Save`}
        </Button>
      </div>
      {isReadOnly && (
        <div className="rb-pe-admin-note">
          {t`Admins have full access. These settings apply only if ${targetName} stops being an admin; change them after removing admin.`}
        </div>
      )}
      <div className="rb-pe-layout">
        <aside className="rb-pe-nav">
          <Input
            variant="search"
            size="sm"
            placeholder={t`Search permissions`}
            aria-label={t`Search permissions`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <nav>
            {visibleSections.map((section) => (
              <a
                key={section.id}
                href={`#rb-pe-${section.id}`}
                className={cx(
                  'rb-pe-nav-item',
                  activeSectionId === section.id && 'is-active',
                )}
                onClick={() => setActiveSectionId(section.id)}
              >
                {section.label}
              </a>
            ))}
          </nav>
        </aside>
        <div className="rb-pe-content">
          <div className="rb-pe-content-head">
            <span className="rb-sp" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setExpandedKeys(
                  isAllExpanded ? new Set() : new Set(allItemKeys),
                )
              }
            >
              {isAllExpanded ? t`Collapse all` : t`Expand all`}
            </Button>
          </div>
          {loading && !isDefined(permissions) && (
            <div className="rb-dt-empty">{t`Loading permissions`}</div>
          )}
          {isDefined(permissions) &&
            visibleSections.map((section) => (
              <div
                key={section.id}
                id={`rb-pe-${section.id}`}
                className="rb-pe-section"
              >
                <h2 className="rb-pe-section-title">{section.label}</h2>
                {isDefined(section.description) && (
                  <p className="rb-pe-help">{section.description}</p>
                )}
                {section.items.map((item) =>
                  item.kind === 'object' ? (
                    <RoboostPermissionObjectCard
                      key={item.key}
                      item={item}
                      permissions={permissions}
                      isExpanded={
                        expandedKeys.has(item.key) || searchTerm !== ''
                      }
                      isReadOnly={isReadOnly}
                      searchTerm={searchTerm}
                      onToggleExpanded={() => toggleExpanded(item.key)}
                      onChange={(objectPermissions) =>
                        update((current) => ({
                          ...current,
                          objects: {
                            ...current.objects,
                            [item.key]: objectPermissions,
                          },
                        }))
                      }
                    />
                  ) : (
                    <RoboostPermissionToggleCard
                      key={item.key}
                      item={item}
                      permissions={permissions}
                      isExpanded={
                        expandedKeys.has(item.key) || searchTerm !== ''
                      }
                      isReadOnly={isReadOnly}
                      searchTerm={searchTerm}
                      onToggleExpanded={() => toggleExpanded(item.key)}
                      onChange={(toggles) =>
                        update((current) => ({
                          ...current,
                          toggles: { ...current.toggles, ...toggles },
                        }))
                      }
                    />
                  ),
                )}
              </div>
            ))}
          <div className="rb-pe-section">
            <h2 className="rb-pe-section-title">{t`Admin only`}</h2>
            <p className="rb-pe-help">
              {t`Only admins can use Layout > Forms, Users & Teams (beyond the user table), Settings > General and Working days, notification rules, and Scoring when Create and edit scores is off.`}
            </p>
          </div>
        </div>
      </div>
      {isDiscardOpen && (
        <RoboostConfirmModal
          title={t`Discard your changes?`}
          body={t`The permissions of ${targetName} stay as they were.`}
          confirmLabel={t`Discard changes`}
          tone="danger"
          isWorking={false}
          onClose={() => setIsDiscardOpen(false)}
          onConfirm={() => {
            setIsDiscardOpen(false);
            setDraft(null);
            leave();
          }}
        />
      )}
    </div>
  );
};
