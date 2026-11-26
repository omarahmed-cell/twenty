import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useToast } from 'twenty-ui/components/feedback';

import { ROBOOST_CHANGE_COMPANY_CURRENCY } from '@/roboost-app/currencies/graphql/roboostCurrencyQueries';
import { type RoboostCurrency } from '@/roboost-app/currencies/types/RoboostCurrency';
import { Button } from '@/roboost-ui/components/Button';
import { Field } from '@/roboost-ui/components/Field';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';

type RoboostCompanyCurrencyModalProps = {
  currency: RoboostCurrency;
  companyCurrencyCode: string;
  onClose: () => void;
  onChanged: () => void;
};

// Changing the company currency re-bases every rate and recalculates every amount: typed confirmation
export const RoboostCompanyCurrencyModal = ({
  currency,
  companyCurrencyCode,
  onClose,
  onChanged,
}: RoboostCompanyCurrencyModalProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [confirmation, setConfirmation] = useState('');
  const [changeCompanyCurrency, { loading }] = useMutation(
    ROBOOST_CHANGE_COMPANY_CURRENCY,
  );

  const handleChange = async () => {
    try {
      await changeCompanyCurrency({ variables: { code: currency.code } });
      enqueueToast({
        status: 'success',
        children: t`The company currency is now ${currency.code}`,
      });
      onChanged();
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <Modal
      title={t`Change the company currency to ${currency.code}?`}
      tone="danger"
      onClose={onClose}
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            tone="danger"
            disabled={confirmation !== currency.code || loading}
            onClick={handleChange}
          >
            {t`Change company currency`}
          </Button>
        </>
      }
    >
      <div className="rb-cur-form">
        <div className="rb-cur-warning">
          {t`Every exchange rate is re-based on ${currency.code}, and every amount in company currency is recalculated, on open and closed deals alike. Totals, reports and scores change. ${companyCurrencyCode} stays as a normal currency.`}
        </div>
        <Field label={t`Type ${currency.code} to confirm`}>
          <Input
            value={confirmation}
            onChange={(event) =>
              setConfirmation(event.target.value.trim().toUpperCase())
            }
          />
        </Field>
      </div>
    </Modal>
  );
};
