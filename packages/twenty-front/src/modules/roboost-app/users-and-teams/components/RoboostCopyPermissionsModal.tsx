import { ROBOOST_COPY_PERMISSIONS } from '@/roboost-app/users-and-teams/graphql/roboostUsersQueries';
import { type RoboostUser } from '@/roboost-app/users-and-teams/types/RoboostUsers';
import { Button } from '@/roboost-ui/components/Button';
import { Modal } from '@/roboost-ui/components/Modal';
import { MultiSelect } from '@/roboost-ui/components/MultiSelect';
import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useToast } from 'twenty-ui/components/feedback';

type RoboostCopyPermissionsModalProps = {
  source: RoboostUser;
  users: RoboostUser[];
  onClose: () => void;
  onCopied: () => void;
};

export const RoboostCopyPermissionsModal = ({
  source,
  users,
  onClose,
  onCopied,
}: RoboostCopyPermissionsModalProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [copyPermissions] = useMutation(ROBOOST_COPY_PERMISSIONS);
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [isCopying, setIsCopying] = useState(false);
  const sourceName = source.name;

  return (
    <Modal
      title={t`Copy ${sourceName}'s permissions`}
      subtitle={t`The users you pick get exactly the same permissions. Admins keep full access; the copy applies if they stop being admins.`}
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
            disabled={targetIds.length === 0 || isCopying}
            onClick={async () => {
              setIsCopying(true);
              try {
                await copyPermissions({
                  variables: {
                    fromWorkspaceMemberId: source.workspaceMemberId,
                    toWorkspaceMemberIds: targetIds,
                  },
                });
                enqueueToast({
                  status: 'success',
                  children: t`Permissions copied`,
                });
                onCopied();
              } catch (error) {
                enqueueToast({
                  status: 'error',
                  children:
                    error instanceof Error ? error.message : String(error),
                });
              } finally {
                setIsCopying(false);
              }
            }}
          >
            {t`Paste permissions`}
          </Button>
        </>
      }
    >
      <div className="rb-ut-form">
        <label className="rb-ut-label">{t`Paste into`}</label>
        <MultiSelect
          placeholder={t`Pick one or several users`}
          value={targetIds}
          options={users
            .filter(
              (user) => user.workspaceMemberId !== source.workspaceMemberId,
            )
            .map((user) => ({
              value: user.workspaceMemberId,
              label: user.name,
              description: user.email,
            }))}
          onChange={setTargetIds}
        />
      </div>
    </Modal>
  );
};
