import { Button } from '@/roboost-ui/components/Button';
import { Modal } from '@/roboost-ui/components/Modal';
import { useLingui } from '@lingui/react/macro';

type RoboostConfirmModalProps = {
  title: string;
  body: string;
  confirmLabel: string;
  tone: 'default' | 'danger';
  isWorking: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const RoboostConfirmModal = ({
  title,
  body,
  confirmLabel,
  tone,
  isWorking,
  onClose,
  onConfirm,
}: RoboostConfirmModalProps) => {
  const { t } = useLingui();

  return (
    <Modal
      tone={tone}
      title={title}
      subtitle={body}
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
            tone={tone === 'danger' ? 'danger' : undefined}
            disabled={isWorking}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
};
