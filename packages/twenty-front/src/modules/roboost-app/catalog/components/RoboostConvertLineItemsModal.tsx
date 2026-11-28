import { useApolloClient } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type RoboostLineItem } from '@/roboost-app/catalog/components/RoboostLineItemsContainer';
import { convertRoboostAmount } from '@/roboost-app/catalog/utils/getRoboostProductPrice';
import { getRoboostPriceFieldName } from '@/roboost-app/catalog/utils/getRoboostPriceFieldName';
import { useRoboostCurrencies } from '@/roboost-app/currencies/hooks/useRoboostCurrencies';
import { Button } from '@/roboost-ui/components/Button';
import { Modal } from '@/roboost-ui/components/Modal';

type RoboostConvertLineItemsModalProps = {
  fromCurrency: string;
  toCurrency: string;
  lineItems: RoboostLineItem[];
  onClose: () => void;
  onDone: () => void;
};

type Choice = 'productPrice' | 'convert' | 'keep';

// After a deal changes currency: take each product's price in the new currency, or convert, or keep the numbers
export const RoboostConvertLineItemsModal = ({
  fromCurrency,
  toCurrency,
  lineItems,
  onClose,
  onDone,
}: RoboostConvertLineItemsModalProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { byCode, companyCurrency } = useRoboostCurrencies();
  const { updateOneRecord } = useUpdateOneRecord();
  const [choice, setChoice] = useState<Choice>('productPrice');
  const [isSaving, setIsSaving] = useState(false);
  const productIds = lineItems
    .map(({ product }) => product?.id)
    .filter(isDefined);
  const toPriceField = getRoboostPriceFieldName(toCurrency);
  const { records: products } = useFindManyRecords<ObjectRecord>({
    objectNameSingular: 'product',
    filter: { id: { in: productIds } },
    recordGqlFields: { id: true, [toPriceField]: true },
    skip: productIds.length === 0,
  });
  const convert = (micros: number) => {
    const converted = convertRoboostAmount({
      amount: micros,
      fromCode: fromCurrency,
      toCode: toCurrency,
      companyCode: companyCurrency?.code ?? 'USD',
      byCode,
    });

    return isDefined(converted) ? Math.round(converted) : micros;
  };

  const apply = async () => {
    if (choice === 'keep') {
      onDone();

      return;
    }
    setIsSaving(true);
    try {
      for (const lineItem of lineItems) {
        const current = lineItem.unitPrice?.amountMicros;
        const productPrice = products.find(
          ({ id }) => id === lineItem.product?.id,
        )?.[toPriceField];
        let amountMicros = isDefined(current) ? convert(current) : null;
        let isPriceConverted = true;

        if (choice === 'productPrice' && typeof productPrice === 'number') {
          amountMicros = Math.round(productPrice * 1_000_000);
          isPriceConverted = false;
        }
        await updateOneRecord({
          objectNameSingular: 'lineItem',
          idToUpdate: lineItem.id,
          updateOneRecordInput: {
            unitPrice: { amountMicros, currencyCode: toCurrency },
            isPriceConverted,
          },
        });
      }
      onDone();
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const choices: { value: Choice; label: string }[] = [
    {
      value: 'productPrice',
      label: t`Use each product's ${toCurrency} price (convert the rest at today's rate)`,
    },
    { value: 'convert', label: t`Convert every price at today's rate` },
    {
      value: 'keep',
      label: t`Keep them in ${fromCurrency} (the total converts them)`,
    },
  ];

  return (
    <Modal
      title={t`The deal currency changed to ${toCurrency}`}
      subtitle={t`Line item prices are still ${fromCurrency} amounts. What should happen to them?`}
      onClose={onClose}
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t`Decide later`}
          </Button>
          <Button variant="primary" disabled={isSaving} onClick={apply}>
            {t`Apply`}
          </Button>
        </>
      }
    >
      <div className="rb-cur-radios">
        {choices.map((option) => (
          <label key={option.value} className="rb-cur-radio">
            <input
              type="radio"
              name="rb-li-convert"
              checked={choice === option.value}
              onChange={() => setChoice(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
};
