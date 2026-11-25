import { formatRoboostDate } from '@/roboost-app/utils/formatRoboostDate';
import { RoboostConfirmModal } from '@/roboost-app/users-and-teams/components/RoboostConfirmModal';
import { RoboostTeamModal } from '@/roboost-app/users-and-teams/components/RoboostTeamModal';
import {
  ROBOOST_DELETE_TEAM,
  ROBOOST_MY_ACCESS,
  ROBOOST_TEAMS,
  ROBOOST_USERS,
} from '@/roboost-app/users-and-teams/graphql/roboostUsersQueries';
import {
  type RoboostTeam,
  type RoboostUsersPage,
} from '@/roboost-app/users-and-teams/types/RoboostUsers';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

type SortKey = 'name' | 'memberCount' | 'createdAt';

type RoboostTeamsTabProps = {
  isAdmin: boolean;
};

export const RoboostTeamsTab = ({ isAdmin }: RoboostTeamsTabProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { data, loading, refetch } = useQuery<{ roboostTeams: RoboostTeam[] }>(
    ROBOOST_TEAMS,
    { fetchPolicy: 'cache-and-network' },
  );
  const { data: usersData } = useQuery<{ roboostUsers: RoboostUsersPage }>(
    ROBOOST_USERS,
    { fetchPolicy: 'cache-first', skip: !isAdmin },
  );
  const [deleteTeam] = useMutation(ROBOOST_DELETE_TEAM, {
    refetchQueries: [ROBOOST_MY_ACCESS, ROBOOST_USERS],
  });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; isAscending: boolean }>({
    key: 'name',
    isAscending: true,
  });
  const [editedTeam, setEditedTeam] = useState<RoboostTeam | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<RoboostTeam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const teams = data?.roboostTeams ?? [];
  const term = search.trim().toLowerCase();

  const visibleTeams = teams
    .filter((team) => term === '' || team.name.toLowerCase().includes(term))
    .sort((first, second) => {
      const order =
        sort.key === 'name'
          ? first.name.localeCompare(second.name)
          : sort.key === 'memberCount'
            ? first.members.length - second.members.length
            : new Date(first.createdAt).getTime() -
              new Date(second.createdAt).getTime();

      return sort.isAscending ? order : -order;
    });

  const columns: { key: SortKey; label: string }[] = [
    { key: 'name', label: t`Team name` },
    { key: 'memberCount', label: t`Members` },
    { key: 'createdAt', label: t`Created date` },
  ];
  const teamToDeleteName = teamToDelete?.name ?? '';

  return (
    <div className="rb-ut-tab">
      <div className="rb-ut-toolbar">
        <span className="rb-sp" />
        {isAdmin && (
          <button
            type="button"
            className="rb-hbtn rb-hbtn-accent"
            onClick={() => setIsCreateOpen(true)}
          >
            <Icon name="plus" size={14} strokeWidth={2} />
            {t`Create team`}
          </button>
        )}
      </div>
      <div className="rb-dt-card rb-ut-card">
        <div className="rb-dt-filters">
          <Input
            variant="search"
            size="sm"
            placeholder={t`Search teams`}
            aria-label={t`Search teams`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="rb-dt-table-wrap">
          <table className="rb-dt-table rb-ut-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>
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
                {isAdmin && <th aria-label={t`Actions`} />}
              </tr>
            </thead>
            <tbody>
              {visibleTeams.map((team) => (
                <tr key={team.id}>
                  <td>
                    <span
                      className="rb-ut-name"
                      title={team.members
                        .map((member) => member.name)
                        .join(', ')}
                    >
                      {team.name}
                    </span>
                  </td>
                  <td>{team.members.length}</td>
                  <td>{formatRoboostDate(team.createdAt)}</td>
                  {isAdmin && (
                    <td className="rb-sc-actions">
                      <Menu
                        align="right"
                        minWidth={160}
                        entries={[
                          {
                            id: 'edit',
                            label: t`Edit team`,
                            icon: 'pencil',
                            onSelect: () => setEditedTeam(team),
                          },
                          {
                            id: 'delete',
                            label: t`Delete team`,
                            icon: 'trash',
                            isDanger: true,
                            onSelect: () => setTeamToDelete(team),
                          },
                        ]}
                        trigger={({ toggle, isOpen }) => (
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            icon="more"
                            aria-label={t`Team actions`}
                            aria-expanded={isOpen}
                            onClick={toggle}
                          />
                        )}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {visibleTeams.length === 0 && !loading && (
            <div className="rb-dt-empty">
              {teams.length === 0 ? t`No teams yet.` : t`No teams match.`}
            </div>
          )}
        </div>
      </div>
      {(isCreateOpen || isDefined(editedTeam)) && (
        <RoboostTeamModal
          team={editedTeam}
          users={(usersData?.roboostUsers.users ?? []).filter(
            (user) => user.memberStatus !== 'DEACTIVATED',
          )}
          onClose={() => {
            setIsCreateOpen(false);
            setEditedTeam(null);
          }}
          onSaved={() => {
            setIsCreateOpen(false);
            setEditedTeam(null);
            refetch();
          }}
        />
      )}
      {isDefined(teamToDelete) && (
        <RoboostConfirmModal
          title={t`Delete the team ${teamToDeleteName}?`}
          body={t`Its members just lose this team; nobody is removed from the workspace.`}
          confirmLabel={t`Delete team`}
          tone="danger"
          isWorking={isDeleting}
          onClose={() => setTeamToDelete(null)}
          onConfirm={async () => {
            setIsDeleting(true);
            try {
              await deleteTeam({ variables: { teamId: teamToDelete.id } });
              await refetch();
              enqueueToast({ status: 'success', children: t`Team deleted` });
            } catch (error) {
              enqueueToast({
                status: 'error',
                children:
                  error instanceof Error ? error.message : String(error),
              });
            } finally {
              setIsDeleting(false);
              setTeamToDelete(null);
            }
          }}
        />
      )}
    </div>
  );
};
