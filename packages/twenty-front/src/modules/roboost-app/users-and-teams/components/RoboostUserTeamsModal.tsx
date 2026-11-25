import { ROBOOST_SET_USER_TEAMS } from '@/roboost-app/users-and-teams/graphql/roboostUsersQueries';
import {
  type RoboostTeam,
  type RoboostUser,
} from '@/roboost-app/users-and-teams/types/RoboostUsers';
import { Button } from '@/roboost-ui/components/Button';
import { Modal } from '@/roboost-ui/components/Modal';
import { MultiSelect } from '@/roboost-ui/components/MultiSelect';
import { Select } from '@/roboost-ui/components/Select';
import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useToast } from 'twenty-ui/components/feedback';

type RoboostUserTeamsModalProps = {
  user: RoboostUser;
  teams: RoboostTeam[];
  onClose: () => void;
  onSaved: () => void;
};

export const RoboostUserTeamsModal = ({
  user,
  teams,
  onClose,
  onSaved,
}: RoboostUserTeamsModalProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [setUserTeams] = useMutation(ROBOOST_SET_USER_TEAMS);
  const membershipOf = (team: RoboostTeam) =>
    team.members.find(
      (member) => member.workspaceMemberId === user.workspaceMemberId,
    );
  const [mainTeamId, setMainTeamId] = useState(
    teams.find((team) => membershipOf(team)?.isMain === true)?.id ?? '',
  );
  const [additionalTeamIds, setAdditionalTeamIds] = useState<string[]>(
    teams
      .filter((team) => membershipOf(team)?.isMain === false)
      .map((team) => team.id),
  );
  const [isSaving, setIsSaving] = useState(false);
  const userName = user.name;

  return (
    <Modal
      title={t`Teams of ${userName}`}
      subtitle={t`A user has one main team and any number of additional teams. "Their team's records" covers all of them.`}
      width={520}
      onClose={onClose}
      footer={
        <>
          <span className="rb-sp" />
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true);
              try {
                await setUserTeams({
                  variables: {
                    workspaceMemberId: user.workspaceMemberId,
                    mainTeamId: mainTeamId === '' ? null : mainTeamId,
                    additionalTeamIds: additionalTeamIds.filter(
                      (teamId) => teamId !== mainTeamId,
                    ),
                  },
                });
                enqueueToast({ status: 'success', children: t`Teams saved` });
                onSaved();
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
        </>
      }
    >
      <div className="rb-ut-form">
        <label className="rb-ut-label">{t`Main team`}</label>
        <Select
          aria-label={t`Main team`}
          placeholder={t`No main team`}
          value={mainTeamId}
          isClearable
          isSearchable
          options={teams.map((team) => ({ value: team.id, label: team.name }))}
          onChange={setMainTeamId}
        />
        <label className="rb-ut-label">{t`Additional teams`}</label>
        <MultiSelect
          placeholder={t`None`}
          value={additionalTeamIds.filter((teamId) => teamId !== mainTeamId)}
          options={teams
            .filter((team) => team.id !== mainTeamId)
            .map((team) => ({ value: team.id, label: team.name }))}
          onChange={setAdditionalTeamIds}
        />
        {teams.length === 0 && (
          <p className="rb-ut-hint">{t`No teams yet. Create one in the Teams tab.`}</p>
        )}
      </div>
    </Modal>
  );
};
