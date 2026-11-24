import { Button } from '@/roboost-ui/components/Button';
import { Field } from '@/roboost-ui/components/Field';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

type RoboostScoreUpdateModalProps = {
  isNew: boolean;
  recordCount: number;
  objectLabel: string;
  isFreezingDeals: boolean;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (note: string | null) => Promise<void>;
};

export const RoboostScoreUpdateModal = ({
  isNew,
  recordCount,
  objectLabel,
  isFreezingDeals,
  isSaving,
  onClose,
  onConfirm,
}: RoboostScoreUpdateModalProps) => {
  const { t } = useLingui();
  const [note, setNote] = useState('');
  const count = recordCount.toLocaleString('en-US');

  return (
    <Modal
      title={isNew ? t`Create this score?` : t`Publish a new version?`}
      subtitle={
        isNew
          ? t`Version 1 is published and the score is turned on.`
          : t`The draft becomes the next version and replaces the current one.`
      }
      width={500}
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
            onClick={() => onConfirm(note.trim() === '' ? null : note.trim())}
          >
            {isNew ? t`Create` : t`Update`}
          </Button>
        </>
      }
    >
      <div className="rb-sc-form">
        <p className="rb-sc-recalc">
          {t`${count} ${objectLabel} will be recalculated in the background.`}
          {isFreezingDeals &&
            ` ${t`Closed Won deals with a frozen score keep it.`}`}
        </p>
        <Field label={t`Note (optional)`}>
          <Input
            aria-label={t`Version note`}
            placeholder={t`What changed in this version?`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
};
