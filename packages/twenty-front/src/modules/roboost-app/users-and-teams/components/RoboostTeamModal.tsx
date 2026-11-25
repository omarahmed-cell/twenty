import {
  ROBOOST_MY_ACCESS,
  ROBOOST_SAVE_TEAM,
  ROBOOST_USERS,
} from '@/roboost-app/users-and-teams/graphql/roboostUsersQueries';
import {
  type RoboostTeam,
  type RoboostUser,
} from '@/roboost-app/users-and-teams/types/RoboostUsers';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Button } from '@/roboost-ui/components/Button';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { Select } from '@/roboost-ui/components/Select';
import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

type TeamMemberDraft = {
  workspaceMemberId: string;
  name: string;
  isMain: boolean;
};

type RoboostTeamModalProps = {
  team: RoboostTeam | null;
  users: RoboostUser[];
  onClose: () => void;
  onSaved: () => void;
};

export const RoboostTeamModal = ({
  team,
  users,
  onClose,
  onSaved,
}: RoboostTeamModalProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [saveTeam] = useMutation(ROBOOST_SAVE_TEAM, {
    refetchQueries: [ROBOOST_MY_ACCESS, ROBOOST_USERS],
  });
  const [name, setName] = useState(team?.name ?? '');
  const [members, setMembers] = useState<TeamMemberDraft[]>(
    team?.members.map((member) => ({ ...member })) ?? [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const memberIds = new Set(members.map((member) => member.workspaceMemberId));

  const setMain = (workspaceMemberId: string, isMain: boolean) =>
    setMembers((current) =>
      current.map((member) =>
        member.workspaceMemberId === workspaceMemberId
          ? { ...member, isMain }
          : member,
      ),
    );

  return (
    <Modal
      title={isDefined(team) ? t`Edit team` : t`Create team`}
      subtitle={t`For each member, choose whether this is their main team or an additional one. Making it someone's main team replaces their previous main team.`}
      width={600}
      onClose={onClose}
      footer={
        <>
          <span className="rb-sp" />
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            disabled={name.trim() === '' || isSaving}
            onClick={async () => {
              setIsSaving(true);
              try {
                await saveTeam({
                  variables: {
                    teamId: team?.id ?? null,
                    name: name.trim(),
                    members: members.map(({ workspaceMemberId, isMain }) => ({
                      workspaceMemberId,
                      isMain,
                    })),
                  },
                });
                enqueueToast({ status: 'success', children: t`Team saved` });
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
            {isDefined(team) ? t`Save` : t`Create team`}
          </Button>
        </>
      }
    >
      <div className="rb-ut-form">
        <label className="rb-ut-label" htmlFor="rb-ut-team-name">
          {t`Team name`}
        </label>
        <Input
          name="rb-ut-team-name"
          placeholder={t`e.g. SDRs`}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <label className="rb-ut-label">{t`Members`}</label>
        <Select
          aria-label={t`Add a member`}
          placeholder={t`Add a member`}
          value=""
          isSearchable
          options={users
            .filter((user) => !memberIds.has(user.workspaceMemberId))
            .map((user) => ({
              value: user.workspaceMemberId,
              label: user.name,
              description: user.email,
            }))}
          onChange={(workspaceMemberId) => {
            const user = users.find(
              (candidate) => candidate.workspaceMemberId === workspaceMemberId,
            );

            if (isDefined(user)) {
              setMembers((current) => [
                ...current,
                {
                  workspaceMemberId,
                  name: user.name,
                  isMain: !isDefined(user.mainTeamId),
                },
              ]);
            }
          }}
        />
        <div className="rb-ut-team-members">
          {members.map((member) => (
            <div key={member.workspaceMemberId} className="rb-ut-team-member">
              <Avatar name={member.name} size="xs" />
              <span className="rb-truncate">{member.name}</span>
              <span className="rb-sp" />
              <Select
                aria-label={t`Team type for ${member.name}`}
                value={member.isMain ? 'main' : 'additional'}
                options={[
                  { value: 'main', label: t`Main team` },
                  { value: 'additional', label: t`Additional team` },
                ]}
                onChange={(value) =>
                  setMain(member.workspaceMemberId, value === 'main')
                }
              />
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon="x"
                aria-label={t`Remove ${member.name}`}
                onClick={() =>
                  setMembers((current) =>
                    current.filter(
                      (candidate) =>
                        candidate.workspaceMemberId !==
                        member.workspaceMemberId,
                    ),
                  )
                }
              />
            </div>
          ))}
          {members.length === 0 && (
            <p className="rb-ut-hint">{t`No members yet.`}</p>
          )}
        </div>
      </div>
    </Modal>
  );
};
