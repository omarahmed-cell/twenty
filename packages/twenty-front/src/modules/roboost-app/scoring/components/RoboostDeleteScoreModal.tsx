import { useInvalidateMetadataStore } from '@/metadata-store/hooks/useInvalidateMetadataStore';
import { ROBOOST_DELETE_SCORE } from '@/roboost-app/scoring/graphql/roboostScoreQueries';
import { type RoboostScore } from '@/roboost-app/scoring/types/RoboostScore';
import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Modal } from '@/roboost-ui/components/Modal';
import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

type RoboostDeleteScoreModalProps = {
  score: RoboostScore;
  propertyLabel: string | null;
  onClose: () => void;
  onDeleted: () => void;
};

export const RoboostDeleteScoreModal = ({
  score,
  propertyLabel,
  onClose,
  onDeleted,
}: RoboostDeleteScoreModalProps) => {
  const { t } = useLingui();
  const { invalidateMetadataStore } = useInvalidateMetadataStore();
  const [deleteProperty, setDeleteProperty] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteScore] = useMutation(ROBOOST_DELETE_SCORE);
  const scoreName = score.name;
  const shownPropertyLabel = propertyLabel ?? t`the score property`;

  return (
    <Modal
      tone="danger"
      title={t`Delete ${scoreName}?`}
      subtitle={t`Its versions and the explanation of every record's score are deleted too. This cannot be undone.`}
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
            tone="danger"
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true);
              try {
                await deleteScore({
                  variables: { scoreId: score.id, deleteProperty },
                });
                invalidateMetadataStore();
                onDeleted();
              } finally {
                setIsDeleting(false);
              }
            }}
          >
            {t`Delete score`}
          </Button>
        </>
      }
    >
      <div className="rb-sc-form">
        <Checkbox
          checked={deleteProperty}
          onChange={() => setDeleteProperty(!deleteProperty)}
        >
          {t`Also delete the property ${shownPropertyLabel} and its values`}
        </Checkbox>
        <p className="rb-sc-hint">
          {deleteProperty
            ? t`The property and every value in it are removed.`
            : t`The property stays as a normal read-only number field with its current values.`}
        </p>
      </div>
    </Modal>
  );
};
