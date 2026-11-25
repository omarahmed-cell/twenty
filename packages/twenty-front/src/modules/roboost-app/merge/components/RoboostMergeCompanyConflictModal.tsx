import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Modal } from '@/roboost-ui/components/Modal';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

type RoboostMergeCompanyConflictModalProps = {
  primaryRecord: Record<string, unknown> | undefined;
  secondaryRecord: Record<string, unknown> | undefined;
  initialSide: 'primary' | 'secondary';
  onClose: () => void;
  onConfirm: (side: 'primary' | 'secondary') => void;
};

const companyNameOf = (record: Record<string, unknown> | undefined) =>
  ((record?.company as { name?: string } | null)?.name ?? '').trim() || '—';

// Contacts, deals and services hold one company; the user decides which one survives
export const RoboostMergeCompanyConflictModal = ({
  primaryRecord,
  secondaryRecord,
  initialSide,
  onClose,
  onConfirm,
}: RoboostMergeCompanyConflictModalProps) => {
  const { t } = useLingui();
  const [side, setSide] = useState(initialSide);
  const primaryCompany = companyNameOf(primaryRecord);
  const secondaryCompany = companyNameOf(secondaryRecord);

  return (
    <Modal
      title={t`These records belong to different companies`}
      subtitle={t`Which company should be the primary company of the merged record?`}
      width={520}
      onClose={onClose}
      footer={
        <>
          <span className="rb-sp" />
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button variant="primary" onClick={() => onConfirm(side)}>
            {t`Merge`}
          </Button>
        </>
      }
    >
      <div className="rb-mg-conflict">
        <label className="rb-mg-conflict-option">
          <input
            type="radio"
            name="rb-mg-company"
            checked={side === 'primary'}
            onChange={() => setSide('primary')}
          />
          <span>
            {primaryCompany}{' '}
            <span className="rb-dt-muted">{t`(from primary)`}</span>
          </span>
        </label>
        <label className="rb-mg-conflict-option">
          <input
            type="radio"
            name="rb-mg-company"
            checked={side === 'secondary'}
            onChange={() => setSide('secondary')}
          />
          <span>
            {secondaryCompany}{' '}
            <span className="rb-dt-muted">{t`(from secondary)`}</span>
          </span>
        </label>
        <Checkbox checked disabled>
          {t`Keep the other company associated too (not as primary)`}
        </Checkbox>
        <p className="rb-ut-hint">
          {t`A record here links to one company only, so the other company can't stay associated. It is kept in the merge history, and Unmerge brings it back.`}
        </p>
      </div>
    </Modal>
  );
};
