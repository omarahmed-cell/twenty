import { ROBOOST_INVITE_USERS } from '@/roboost-app/users-and-teams/graphql/roboostUsersQueries';
import { type RoboostUser } from '@/roboost-app/users-and-teams/types/RoboostUsers';
import { Button } from '@/roboost-ui/components/Button';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { Select } from '@/roboost-ui/components/Select';
import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

type RoboostInviteUsersModalProps = {
  users: RoboostUser[];
  initialCopyFromWorkspaceMemberId: string | null;
  onClose: () => void;
  onInvited: () => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RoboostInviteUsersModal = ({
  users,
  initialCopyFromWorkspaceMemberId,
  onClose,
  onInvited,
}: RoboostInviteUsersModalProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [inviteUsers] = useMutation(ROBOOST_INVITE_USERS);
  const [emailsText, setEmailsText] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [copyFrom, setCopyFrom] = useState(
    initialCopyFromWorkspaceMemberId ?? '',
  );
  const [isSending, setIsSending] = useState(false);
  const emails = emailsText
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter((email) => email !== '');
  const invalidEmails = emails.filter((email) => !EMAIL_PATTERN.test(email));
  const canSend = emails.length > 0 && invalidEmails.length === 0;

  return (
    <Modal
      title={t`Invite users`}
      subtitle={t`They get an email with a link to join. Until they accept, they show as Pending invite.`}
      width={560}
      onClose={onClose}
      footer={
        <>
          <span className="rb-sp" />
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            disabled={!canSend || isSending}
            onClick={async () => {
              setIsSending(true);
              try {
                await inviteUsers({
                  variables: {
                    emails,
                    role,
                    copyFromWorkspaceMemberId:
                      role === 'MEMBER' && copyFrom !== '' ? copyFrom : null,
                  },
                });
                const count = emails.length;

                enqueueToast({
                  status: 'success',
                  children:
                    count === 1
                      ? t`Invitation sent`
                      : t`${count} invitations sent`,
                });
                onInvited();
              } catch (error) {
                enqueueToast({
                  status: 'error',
                  children:
                    error instanceof Error ? error.message : String(error),
                });
              } finally {
                setIsSending(false);
              }
            }}
          >
            {t`Send invitations`}
          </Button>
        </>
      }
    >
      <div className="rb-ut-form">
        <label className="rb-ut-label" htmlFor="rb-ut-invite-emails">
          {t`Email addresses`}
        </label>
        <Input
          name="rb-ut-invite-emails"
          placeholder={t`name@roboost.app, another@roboost.app`}
          value={emailsText}
          invalid={invalidEmails.length > 0}
          onChange={(event) => setEmailsText(event.target.value)}
        />
        {invalidEmails.length > 0 && (
          <p className="rb-ut-error">
            {t`Not an email address: ${invalidEmails.join(', ')}`}
          </p>
        )}
        <label className="rb-ut-label">{t`Role`}</label>
        <Select
          aria-label={t`Role`}
          value={role}
          options={[
            {
              value: 'MEMBER',
              label: t`Member`,
              description: t`Uses the permissions you give them`,
            },
            {
              value: 'ADMIN',
              label: t`Admin`,
              description: t`Full access to everything`,
            },
          ]}
          onChange={(value) => setRole(value === 'ADMIN' ? 'ADMIN' : 'MEMBER')}
        />
        {role === 'MEMBER' && (
          <>
            <label className="rb-ut-label">{t`Copy permissions from`}</label>
            <Select
              aria-label={t`Copy permissions from`}
              placeholder={t`No one: use the default permissions`}
              value={copyFrom}
              isClearable
              isSearchable
              options={users
                .filter((user) => user.role === 'MEMBER')
                .map((user) => ({
                  value: user.workspaceMemberId,
                  label: user.name,
                  description: user.email,
                }))}
              onChange={setCopyFrom}
            />
            <p className="rb-ut-hint">
              {isDefined(
                users.find((user) => user.workspaceMemberId === copyFrom),
              )
                ? t`They join with the same permissions as the person you picked.`
                : t`Without a source, they join with the default member permissions.`}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
};
