import { EMAIL_PASSWORD_RESET_LINK } from '@/auth/graphql/mutations/emailPasswordResetLink';
import { formatRoboostDate } from '@/roboost-app/utils/formatRoboostDate';
import { RoboostConfirmModal } from '@/roboost-app/users-and-teams/components/RoboostConfirmModal';
import { RoboostCopyPermissionsModal } from '@/roboost-app/users-and-teams/components/RoboostCopyPermissionsModal';
import { RoboostInviteUsersModal } from '@/roboost-app/users-and-teams/components/RoboostInviteUsersModal';
import { RoboostPermissionHistoryModal } from '@/roboost-app/users-and-teams/components/RoboostPermissionHistoryModal';
import { RoboostPickUserModal } from '@/roboost-app/users-and-teams/components/RoboostPickUserModal';
import { RoboostUserTeamsModal } from '@/roboost-app/users-and-teams/components/RoboostUserTeamsModal';
import {
  ROBOOST_MY_ACCESS,
  ROBOOST_SET_USER_ADMIN,
  ROBOOST_SET_USER_STATUS,
  ROBOOST_TEAMS,
  ROBOOST_USERS,
} from '@/roboost-app/users-and-teams/graphql/roboostUsersQueries';
import {
  type RoboostTeam,
  type RoboostUser,
  type RoboostUsersPage,
} from '@/roboost-app/users-and-teams/types/RoboostUsers';
import {
  getRoboostCompareAccessPath,
  getRoboostEditPermissionsPath,
} from '@/roboost-app/users-and-teams/utils/getRoboostUsersAndTeamsPath';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { Select } from '@/roboost-ui/components/Select';
import { Tabs } from '@/roboost-ui/components/Tabs';
import { Tag } from '@/roboost-ui/components/Tag';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

type SortKey = 'name' | 'email' | 'role' | 'access' | 'team' | 'createdAt';

type UserRow = {
  id: string;
  user: RoboostUser | null;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  access: string | null;
  team: string;
  createdAt: string;
  isPendingInvite: boolean;
};

type ConfirmAction = {
  kind: 'deactivate' | 'reactivate' | 'reset' | 'admin';
  user: RoboostUser;
} | null;

const CREATED_WINDOWS: Record<string, number> = {
  '7': 7,
  '30': 30,
  '90': 90,
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const RoboostUsersTab = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { enqueueToast } = useToast();
  const { data, loading, refetch } = useQuery<{
    roboostUsers: RoboostUsersPage;
  }>(ROBOOST_USERS, { fetchPolicy: 'cache-and-network' });
  const { data: teamsData } = useQuery<{ roboostTeams: RoboostTeam[] }>(
    ROBOOST_TEAMS,
    { fetchPolicy: 'cache-and-network' },
  );
  const [setUserAdmin] = useMutation(ROBOOST_SET_USER_ADMIN, {
    refetchQueries: [ROBOOST_MY_ACCESS],
  });
  const [setUserStatus] = useMutation(ROBOOST_SET_USER_STATUS);
  const [sendResetLink] = useMutation(EMAIL_PASSWORD_RESET_LINK);
  const [statusTab, setStatusTab] = useState<'active' | 'deactivated'>(
    'active',
  );
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [createdFilter, setCreatedFilter] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; isAscending: boolean }>({
    key: 'name',
    isAscending: true,
  });
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteCopySource, setInviteCopySource] = useState<RoboostUser | null>(
    null,
  );
  const [copySource, setCopySource] = useState<RoboostUser | null>(null);
  const [compareSource, setCompareSource] = useState<RoboostUser | null>(null);
  const [teamsUser, setTeamsUser] = useState<RoboostUser | null>(null);
  const [historyUser, setHistoryUser] = useState<RoboostUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [isWorking, setIsWorking] = useState(false);

  const page = data?.roboostUsers;
  const isAdmin = page?.viewerIsAdmin === true;
  const users = page?.users ?? [];
  const teams = teamsData?.roboostTeams ?? [];
  const activeUsers = users.filter(
    (user) => user.memberStatus !== 'DEACTIVATED',
  );
  const deactivatedUsers = users.filter(
    (user) => user.memberStatus === 'DEACTIVATED',
  );
  const pendingInvites = (page?.pendingInvites ?? []).filter(
    (invite) =>
      !users.some(
        (user) => user.email.toLowerCase() === invite.email.toLowerCase(),
      ),
  );

  const rows: UserRow[] = [
    ...(statusTab === 'active' ? activeUsers : deactivatedUsers).map(
      (user) => ({
        id: user.workspaceMemberId,
        user,
        name: user.name,
        email: user.email,
        role: user.role,
        access: user.access,
        team: user.mainTeamName ?? '',
        createdAt: user.createdAt,
        isPendingInvite: false,
      }),
    ),
    ...(statusTab === 'active'
      ? pendingInvites.map((invite) => ({
          id: invite.id,
          user: null,
          name: invite.email,
          email: invite.email,
          role: invite.role,
          access: null,
          team: '',
          createdAt: invite.invitedAt ?? invite.expiresAt,
          isPendingInvite: true,
        }))
      : []),
  ];

  const term = search.trim().toLowerCase();
  const createdWindowDays = CREATED_WINDOWS[createdFilter];
  const visibleRows = rows
    .filter(
      (row) =>
        (term === '' ||
          row.name.toLowerCase().includes(term) ||
          row.email.toLowerCase().includes(term)) &&
        (roleFilter === '' || row.role === roleFilter) &&
        (teamFilter === '' ||
          (teamFilter === 'none'
            ? row.team === ''
            : row.user?.mainTeamId === teamFilter)) &&
        (!isDefined(createdWindowDays) ||
          Date.now() - new Date(row.createdAt).getTime() <=
            createdWindowDays * 86400000),
    )
    .sort((first, second) => {
      const firstValue =
        sort.key === 'createdAt'
          ? new Date(first.createdAt).getTime()
          : String(first[sort.key] ?? '').toLowerCase();
      const secondValue =
        sort.key === 'createdAt'
          ? new Date(second.createdAt).getTime()
          : String(second[sort.key] ?? '').toLowerCase();
      const order =
        typeof firstValue === 'number' && typeof secondValue === 'number'
          ? firstValue - secondValue
          : String(firstValue).localeCompare(String(secondValue));

      return sort.isAscending ? order : -order;
    });

  const columns: { key: SortKey; label: string }[] = [
    { key: 'name', label: t`Name` },
    { key: 'email', label: t`Email` },
    { key: 'role', label: t`Role` },
    ...(isAdmin ? [{ key: 'access' as const, label: t`Access` }] : []),
    { key: 'team', label: t`Team` },
    { key: 'createdAt', label: t`Created date` },
  ];

  const runAction = async (work: () => Promise<unknown>, success: string) => {
    setIsWorking(true);
    try {
      await work();
      await refetch();
      enqueueToast({ status: 'success', children: success });
    } catch (error) {
      enqueueToast({ status: 'error', children: getErrorMessage(error) });
    } finally {
      setIsWorking(false);
      setConfirmAction(null);
    }
  };

  const buildActions = (user: RoboostUser) => {
    const isDeactivated = user.memberStatus === 'DEACTIVATED';

    return [
      {
        id: 'admin',
        label: user.role === 'ADMIN' ? t`Remove admin` : t`Make admin`,
        icon: 'user' as const,
        onSelect: () => setConfirmAction({ kind: 'admin', user }),
      },
      {
        id: 'copy-existing',
        label: t`Copy permissions to users`,
        icon: 'copy' as const,
        onSelect: () => setCopySource(user),
      },
      {
        id: 'copy-new',
        label: t`Copy permissions to a new user`,
        icon: 'plus' as const,
        onSelect: () => {
          setInviteCopySource(user);
          setIsInviteOpen(true);
        },
      },
      {
        id: 'compare',
        label: t`Compare access`,
        icon: 'columns' as const,
        onSelect: () => setCompareSource(user),
      },
      {
        id: 'teams',
        label: t`Edit main team`,
        icon: 'contacts' as const,
        onSelect: () => setTeamsUser(user),
      },
      {
        id: 'history',
        label: t`View permission history`,
        icon: 'history' as const,
        onSelect: () => setHistoryUser(user),
      },
      {
        id: 'reset',
        label: t`Reset password`,
        icon: 'refresh' as const,
        isDisabled: !user.hasAccount,
        onSelect: () => setConfirmAction({ kind: 'reset', user }),
      },
      { id: 'separator', isSeparator: true as const },
      isDeactivated
        ? {
            id: 'reactivate',
            label: t`Reactivate user`,
            icon: 'check' as const,
            onSelect: () => setConfirmAction({ kind: 'reactivate', user }),
          }
        : {
            id: 'deactivate',
            label: t`Deactivate user`,
            icon: 'x' as const,
            isDanger: true,
            onSelect: () => setConfirmAction({ kind: 'deactivate', user }),
          },
    ];
  };

  const confirmCopy = (() => {
    if (!isDefined(confirmAction)) {
      return null;
    }
    const name = confirmAction.user.name;

    switch (confirmAction.kind) {
      case 'deactivate':
        return {
          title: t`Deactivate ${name}?`,
          body: t`They can no longer sign in. Their records stay assigned to them, and you can reactivate them later.`,
          confirmLabel: t`Deactivate user`,
          tone: 'danger' as const,
          run: () =>
            setUserStatus({
              variables: {
                workspaceMemberId: confirmAction.user.workspaceMemberId,
                memberStatus: 'DEACTIVATED',
              },
            }),
          success: t`${name} deactivated`,
        };
      case 'reactivate':
        return {
          title: t`Reactivate ${name}?`,
          body: t`They can sign in again with the permissions they had.`,
          confirmLabel: t`Reactivate user`,
          tone: 'default' as const,
          run: () =>
            setUserStatus({
              variables: {
                workspaceMemberId: confirmAction.user.workspaceMemberId,
                memberStatus: 'ACTIVE',
              },
            }),
          success: t`${name} reactivated`,
        };
      case 'reset':
        return {
          title: t`Send a password reset email to ${name}?`,
          body: t`They get an email with a link to choose a new password.`,
          confirmLabel: t`Send reset email`,
          tone: 'default' as const,
          run: () =>
            sendResetLink({ variables: { email: confirmAction.user.email } }),
          success: t`Reset email sent to ${name}`,
        };
      case 'admin':
        return confirmAction.user.role === 'ADMIN'
          ? {
              title: t`Remove admin from ${name}?`,
              body: t`They go back to the permissions saved for them in Edit permissions.`,
              confirmLabel: t`Remove admin`,
              tone: 'danger' as const,
              run: () =>
                setUserAdmin({
                  variables: {
                    workspaceMemberId: confirmAction.user.workspaceMemberId,
                    isAdmin: false,
                  },
                }),
              success: t`${name} is now a member`,
            }
          : {
              title: t`Make ${name} an admin?`,
              body: t`Admins have full access to everything, including Users & Teams.`,
              confirmLabel: t`Make admin`,
              tone: 'default' as const,
              run: () =>
                setUserAdmin({
                  variables: {
                    workspaceMemberId: confirmAction.user.workspaceMemberId,
                    isAdmin: true,
                  },
                }),
              success: t`${name} is now an admin`,
            };
    }
  })();

  const activeCount = activeUsers.length + pendingInvites.length;
  const deactivatedCount = deactivatedUsers.length;

  return (
    <div className="rb-ut-tab">
      <div className="rb-ut-toolbar">
        <Tabs
          className="rb-ut-subtabs"
          hasBorder={false}
          tabs={[
            { id: 'active', label: t`Active users`, count: activeCount },
            {
              id: 'deactivated',
              label: t`Deactivated users`,
              count: deactivatedCount,
            },
          ]}
          value={statusTab}
          onChange={(id) =>
            setStatusTab(id === 'deactivated' ? 'deactivated' : 'active')
          }
        />
        <span className="rb-sp" />
        {isAdmin && (
          <button
            type="button"
            className="rb-hbtn rb-hbtn-accent"
            onClick={() => {
              setInviteCopySource(null);
              setIsInviteOpen(true);
            }}
          >
            <Icon name="plus" size={14} strokeWidth={2} />
            {t`Invite users`}
          </button>
        )}
      </div>
      <div className="rb-dt-card rb-ut-card">
        <div className="rb-dt-filters">
          <Input
            variant="search"
            size="sm"
            placeholder={t`Search by name or email`}
            aria-label={t`Search users`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            aria-label={t`Role`}
            placeholder={t`Role: All`}
            value={roleFilter}
            isClearable
            options={[
              { value: 'ADMIN', label: t`Admin` },
              { value: 'MEMBER', label: t`Member` },
            ]}
            onChange={setRoleFilter}
          />
          <Select
            aria-label={t`Team`}
            placeholder={t`Team: All`}
            value={teamFilter}
            isClearable
            isSearchable
            options={[
              { value: 'none', label: t`No team` },
              ...teams.map((team) => ({ value: team.id, label: team.name })),
            ]}
            onChange={setTeamFilter}
          />
          <Select
            aria-label={t`Created date`}
            placeholder={t`Created: Any time`}
            value={createdFilter}
            isClearable
            options={[
              { value: '7', label: t`Created in the last 7 days` },
              { value: '30', label: t`Created in the last 30 days` },
              { value: '90', label: t`Created in the last 90 days` },
            ]}
            onChange={setCreatedFilter}
          />
        </div>
        <div className="rb-dt-table-wrap">
          <table className="rb-dt-table rb-ut-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    aria-sort={
                      sort.key === column.key
                        ? sort.isAscending
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      className="rb-dt-sort"
                      onClick={() =>
                        setSort((current) => ({
                          key: column.key,
                          isAscending:
                            current.key === column.key
                              ? !current.isAscending
                              : true,
                        }))
                      }
                    >
                      {column.label}
                      {sort.key === column.key && (
                        <Icon
                          name={sort.isAscending ? 'arrow-up' : 'arrow-down'}
                          size={12}
                        />
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className="rb-ut-row">
                  <td>
                    <div className="rb-ut-name-cell">
                      <Avatar
                        name={row.name}
                        src={row.user?.avatarUrl ?? undefined}
                        size="sm"
                      />
                      <span className="rb-truncate rb-ut-name">{row.name}</span>
                      {row.isPendingInvite && (
                        <Tag tone="warning">{t`Pending invite`}</Tag>
                      )}
                      {!row.isPendingInvite &&
                        row.user?.hasAccount === false && (
                          <Tag>{t`Not signed in yet`}</Tag>
                        )}
                      {isAdmin && isDefined(row.user) && (
                        <span className="rb-ut-row-actions">
                          <Link
                            className="rb-btn rb-btn-secondary rb-btn-sm"
                            to={getRoboostEditPermissionsPath(
                              row.user.workspaceMemberId,
                            )}
                          >
                            {t`Edit permissions`}
                          </Link>
                          <Menu
                            align="right"
                            minWidth={230}
                            entries={buildActions(row.user)}
                            trigger={({ toggle, isOpen }) => (
                              <Button
                                variant="secondary"
                                size="sm"
                                aria-expanded={isOpen}
                                onClick={toggle}
                              >
                                {t`Actions`}
                                <Icon name="caret" size={12} />
                              </Button>
                            )}
                          />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="rb-dt-muted">{row.email}</td>
                  <td>{row.role === 'ADMIN' ? t`Admin` : t`Member`}</td>
                  {isAdmin && (
                    <td className="rb-ut-access" title={row.access ?? ''}>
                      {row.access ?? '—'}
                    </td>
                  )}
                  <td>{row.team === '' ? '—' : row.team}</td>
                  <td>{formatRoboostDate(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRows.length === 0 && !loading && (
            <div className="rb-dt-empty">
              {statusTab === 'deactivated'
                ? t`No deactivated users.`
                : t`No users match.`}
            </div>
          )}
        </div>
      </div>
      {isInviteOpen && (
        <RoboostInviteUsersModal
          users={activeUsers}
          initialCopyFromWorkspaceMemberId={
            inviteCopySource?.workspaceMemberId ?? null
          }
          onClose={() => setIsInviteOpen(false)}
          onInvited={() => {
            setIsInviteOpen(false);
            refetch();
          }}
        />
      )}
      {isDefined(copySource) && (
        <RoboostCopyPermissionsModal
          source={copySource}
          users={activeUsers}
          onClose={() => setCopySource(null)}
          onCopied={() => {
            setCopySource(null);
            refetch();
          }}
        />
      )}
      {isDefined(compareSource) && (
        <RoboostPickUserModal
          title={t`Compare ${compareSource.name} with`}
          confirmLabel={t`Compare access`}
          users={users.filter(
            (user) =>
              user.workspaceMemberId !== compareSource.workspaceMemberId,
          )}
          onClose={() => setCompareSource(null)}
          onPick={(user) =>
            navigate(
              getRoboostCompareAccessPath(
                compareSource.workspaceMemberId,
                user.workspaceMemberId,
              ),
            )
          }
        />
      )}
      {isDefined(teamsUser) && (
        <RoboostUserTeamsModal
          user={teamsUser}
          teams={teams}
          onClose={() => setTeamsUser(null)}
          onSaved={() => {
            setTeamsUser(null);
            refetch();
          }}
        />
      )}
      {isDefined(historyUser) && (
        <RoboostPermissionHistoryModal
          workspaceMemberId={historyUser.workspaceMemberId}
          title={t`Permission history: ${historyUser.name}`}
          onClose={() => setHistoryUser(null)}
        />
      )}
      {isDefined(confirmCopy) && (
        <RoboostConfirmModal
          title={confirmCopy.title}
          body={confirmCopy.body}
          confirmLabel={confirmCopy.confirmLabel}
          tone={confirmCopy.tone}
          isWorking={isWorking}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => runAction(confirmCopy.run, confirmCopy.success)}
        />
      )}
    </div>
  );
};
