import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useToast } from 'twenty-ui/components/feedback';

import { ROBOOST_SET_EXCHANGE_RATE } from '@/roboost-app/currencies/graphql/roboostCurrencyQueries';
import { type RoboostCurrency } from '@/roboost-app/currencies/types/RoboostCurrency';
import { Button } from '@/roboost-ui/components/Button';
import { Field } from '@/roboost-ui/components/Field';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';

type RoboostEditRateModalProps = {
  currency: RoboostCurrency;
  companyCurrencyCode: string;
  onClose: () => void;
  onSaved: () => void;
};

export const RoboostEditRateModal = ({
  currency,
  companyCurrencyCode,
  onClose,
  onSaved,
}: RoboostEditRateModalProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [rate, setRate] = useState(String(currency.rate));
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [setExchangeRate, { loading }] = useMutation(ROBOOST_SET_EXCHANGE_RATE);
  const parsedRate = Number(rate);
  const isValid =
    Number.isFinite(parsedRate) && parsedRate > 0 && effectiveDate !== '';

  const handleSave = async () => {
    try {
      await setExchangeRate({
        variables: { code: currency.code, rate: parsedRate, effectiveDate },
      });
      enqueueToast({
        status: 'success',
        children: t`Rate for ${currency.code} saved from ${effectiveDate}`,
      });
      onSaved();
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <Modal
      title={t`Edit exchange rate`}
      subtitle={`${currency.name} (${currency.code}) ${currency.symbol}`}
      onClose={onClose}
      width={480}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            disabled={!isValid || loading}
            onClick={handleSave}
          >
            {t`Save rate`}
          </Button>
        </>
      }
    >
      <div className="rb-cur-form">
        <Field
          label={t`Exchange rate`}
          required
          hint={t`1 ${currency.code} = how many ${companyCurrencyCode}`}
        >
          <Input
            type="number"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
          />
        </Field>
        <Field
          label={t`Effective from`}
          required
          hint={t`A manual rate wins over the automatic one on the same day. Closed deals use the rate on their close date.`}
        >
          <Input
            type="date"
            value={effectiveDate}
            onChange={(event) => setEffectiveDate(event.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
};
