import { type RoboostUser } from '@/roboost-app/users-and-teams/types/RoboostUsers';
import { Button } from '@/roboost-ui/components/Button';
import { Modal } from '@/roboost-ui/components/Modal';
import { Select } from '@/roboost-ui/components/Select';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';

type RoboostPickUserModalProps = {
  title: string;
  confirmLabel: string;
  users: RoboostUser[];
  onClose: () => void;
  onPick: (user: RoboostUser) => void;
};

export const RoboostPickUserModal = ({
  title,
  confirmLabel,
  users,
  onClose,
  onPick,
}: RoboostPickUserModalProps) => {
  const { t } = useLingui();
  const [pickedId, setPickedId] = useState('');
  const picked = users.find((user) => user.workspaceMemberId === pickedId);

  return (
    <Modal
      title={title}
      width={480}
      onClose={onClose}
      footer={
        <>
          <span className="rb-sp" />
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            disabled={!isDefined(picked)}
            onClick={() => {
              if (isDefined(picked)) {
                onPick(picked);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="rb-ut-form">
        <Select
          aria-label={t`User`}
          placeholder={t`Pick a user`}
          value={pickedId}
          isSearchable
          autoOpen
          options={users.map((user) => ({
            value: user.workspaceMemberId,
            label: user.name,
            description: user.email,
          }))}
          onChange={setPickedId}
        />
      </div>
    </Modal>
  );
};
