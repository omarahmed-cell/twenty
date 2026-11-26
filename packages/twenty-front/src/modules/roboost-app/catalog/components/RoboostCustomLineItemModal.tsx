import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useToast } from 'twenty-ui/components/feedback';

import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { Button } from '@/roboost-ui/components/Button';
import { Field } from '@/roboost-ui/components/Field';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { Select } from '@/roboost-ui/components/Select';

type RoboostCustomLineItemModalProps = {
  dealId: string;
  dealCurrency: string;
  onClose: () => void;
  onCreated: () => void;
};

// A line that isn't in the product library
export const RoboostCustomLineItemModal = ({
  dealId,
  dealCurrency,
  onClose,
  onCreated,
}: RoboostCustomLineItemModalProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: 'lineItem',
  });
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discount, setDiscount] = useState('0');
  const [isSaving, setIsSaving] = useState(false);
  const isValid =
    name.trim() !== '' &&
    Number.isFinite(Number(quantity)) &&
    price !== '' &&
    Number.isFinite(Number(price));

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      await createOneRecord({
        dealId,
        name: name.trim(),
        quantity: Number(quantity),
        unitPrice: {
          amountMicros: Math.round(Number(price) * 1_000_000),
          currencyCode: dealCurrency,
        },
        discountType,
        unitDiscount: Number(discount) || 0,
        source: 'DEAL',
      });
      onCreated();
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={t`Create custom line item`}
      onClose={onClose}
      width={480}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            disabled={!isValid || isSaving}
            onClick={handleCreate}
          >
            {t`Add line item`}
          </Button>
        </>
      }
    >
      <div className="rb-cur-form">
        <Field label={t`Name`} required>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <div className="rb-li-form-row">
          <Field label={t`Quantity`} required>
            <Input
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </Field>
          <Field label={t`Unit price (${dealCurrency})`} required>
            <Input
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </Field>
        </div>
        <div className="rb-li-form-row">
          <Field label={t`Discount type`}>
            <Select
              options={[
                { value: 'PERCENTAGE', label: t`Percentage` },
                { value: 'AMOUNT', label: t`Amount` },
              ]}
              value={discountType}
              onChange={setDiscountType}
            />
          </Field>
          <Field label={t`Discount`}>
            <Input
              type="number"
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
};
