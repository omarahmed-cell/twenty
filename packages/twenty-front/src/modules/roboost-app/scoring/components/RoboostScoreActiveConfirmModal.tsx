import { Button } from '@/roboost-ui/components/Button';
import { Modal } from '@/roboost-ui/components/Modal';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

type RoboostScoreActiveConfirmModalProps = {
  scoreName: string;
  nextIsActive: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export const RoboostScoreActiveConfirmModal = ({
  scoreName,
  nextIsActive,
  onClose,
  onConfirm,
}: RoboostScoreActiveConfirmModalProps) => {
  const { t } = useLingui();
  const [isSaving, setIsSaving] = useState(false);

  return (
    <Modal
      title={
        nextIsActive ? t`Turn on ${scoreName}?` : t`Turn off ${scoreName}?`
      }
      subtitle={
        nextIsActive
          ? t`Every record is recalculated in the background with the published version.`
          : t`The property stops updating and keeps its last values.`
      }
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
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true);
              try {
                await onConfirm();
              } finally {
                setIsSaving(false);
              }
            }}
          >
            {nextIsActive ? t`Turn on` : t`Turn off`}
          </Button>
        </>
      }
    />
  );
};
