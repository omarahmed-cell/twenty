import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { type RoboostCurrencyStatus } from '@/roboost-app/currencies/types/RoboostCurrency';
import { Button } from '@/roboost-ui/components/Button';
import { Modal } from '@/roboost-ui/components/Modal';

type Frequency = RoboostCurrencyStatus['frequency'];

type RoboostRateFrequencyModalProps = {
  frequency: Frequency;
  onClose: () => void;
  onSave: (frequency: Frequency) => void;
};

export const RoboostRateFrequencyModal = ({
  frequency,
  onClose,
  onSave,
}: RoboostRateFrequencyModalProps) => {
  const { t } = useLingui();
  const [value, setValue] = useState<Frequency>(frequency);
  const choices: { value: Frequency; label: string }[] = [
    { value: 'DAILY', label: t`Daily` },
    { value: 'MONTHLY', label: t`Monthly` },
    { value: 'QUARTERLY', label: t`Quarterly` },
    { value: 'YEARLY', label: t`Yearly` },
  ];

  return (
    <Modal
      title={t`Update exchange rate frequency`}
      onClose={onClose}
      width={460}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            disabled={value === frequency}
            onClick={() => onSave(value)}
          >
            {t`Update`}
          </Button>
        </>
      }
    >
      <div className="rb-cur-form">
        <span className="rb-cur-label">{t`Choose how often exchange rates update`}</span>
        <div className="rb-cur-radios">
          {choices.map((choice) => (
            <label key={choice.value} className="rb-cur-radio">
              <input
                type="radio"
                name="rb-cur-frequency"
                checked={value === choice.value}
                onChange={() => setValue(choice.value)}
              />
              <span>{choice.label}</span>
            </label>
          ))}
        </div>
        {value !== 'DAILY' && (
          <div className="rb-cur-info">
            {t`Without daily updates, closed deals use the latest rate saved on or before their close date.`}
          </div>
        )}
      </div>
    </Modal>
  );
};
