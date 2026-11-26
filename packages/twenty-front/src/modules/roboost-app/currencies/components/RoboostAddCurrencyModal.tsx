import { useApolloClient, useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { ROBOOST_ALL_CURRENCY_CODES } from 'twenty-shared/constants';
import { formatRoboostCurrencyName } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

import {
  ROBOOST_ADD_CURRENCY,
  ROBOOST_SUGGESTED_EXCHANGE_RATE,
} from '@/roboost-app/currencies/graphql/roboostCurrencyQueries';
import { type RoboostCurrency } from '@/roboost-app/currencies/types/RoboostCurrency';
import { Button } from '@/roboost-ui/components/Button';
import { Field } from '@/roboost-ui/components/Field';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { Select } from '@/roboost-ui/components/Select';

type RoboostAddCurrencyModalProps = {
  currencies: RoboostCurrency[];
  companyCurrencyCode: string;
  onClose: () => void;
  onAdded: () => void;
};

export const RoboostAddCurrencyModal = ({
  currencies,
  companyCurrencyCode,
  onClose,
  onAdded,
}: RoboostAddCurrencyModalProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [code, setCode] = useState('');
  const [rate, setRate] = useState('');
  const client = useApolloClient();
  const [addCurrency, { loading }] = useMutation(ROBOOST_ADD_CURRENCY);
  const [isSuggested, setIsSuggested] = useState(false);

  // Prefill from the latest fetched provider rates when there are some
  const handleCodeChange = async (nextCode: string) => {
    setCode(nextCode);
    setIsSuggested(false);
    const { data } = await client.query<{
      roboostSuggestedExchangeRate: number | null;
    }>({
      query: ROBOOST_SUGGESTED_EXCHANGE_RATE,
      variables: { code: nextCode },
      fetchPolicy: 'network-only',
    });
    const suggested = data?.roboostSuggestedExchangeRate;

    if (suggested !== null && suggested !== undefined) {
      setRate(suggested.toFixed(6));
      setIsSuggested(true);
    }
  };
  const options = useMemo(() => {
    const taken = new Set(currencies.map((currency) => currency.code));

    return ROBOOST_ALL_CURRENCY_CODES.filter(
      (candidate) => !taken.has(candidate),
    )
      .map((candidate) => ({
        value: candidate,
        label: formatRoboostCurrencyName(candidate),
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [currencies]);
  const parsedRate = Number(rate);
  const isValid = code !== '' && Number.isFinite(parsedRate) && parsedRate > 0;

  const handleAdd = async () => {
    try {
      await addCurrency({ variables: { code, rate: parsedRate } });
      enqueueToast({ status: 'success', children: t`${code} added` });
      onAdded();
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <Modal
      title={t`Add currency`}
      onClose={onClose}
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            disabled={!isValid || loading}
            onClick={handleAdd}
          >
            {t`Add`}
          </Button>
        </>
      }
    >
      <div className="rb-cur-form">
        <Field label={t`Currency`} required>
          <Select
            options={options}
            value={code}
            onChange={handleCodeChange}
            placeholder={t`Select a currency`}
            isSearchable
          />
        </Field>
        <Field
          label={t`Exchange rate`}
          required
          hint={
            code === ''
              ? t`How many ${companyCurrencyCode} one unit of the currency is worth.`
              : isSuggested
                ? t`Prefilled from the latest fetched rate: 1 ${code} = this many ${companyCurrencyCode}.`
                : t`1 ${code} = how many ${companyCurrencyCode}. The daily update replaces it with the latest rate.`
          }
        >
          <Input
            type="number"
            value={rate}
            placeholder="0.000000"
            onChange={(event) => {
              setRate(event.target.value);
              setIsSuggested(false);
            }}
          />
        </Field>
      </div>
    </Modal>
  );
};
