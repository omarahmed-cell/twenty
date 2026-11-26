import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { formatRoboostCurrencyValue, isDefined } from 'twenty-shared/utils';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getRoboostPriceFieldName } from '@/roboost-app/catalog/utils/getRoboostPriceFieldName';
import { useRoboostCurrencies } from '@/roboost-app/currencies/hooks/useRoboostCurrencies';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';

export type RoboostLibraryProduct = ObjectRecord & {
  name?: string | null;
  sku?: string | null;
  billingFrequency?: string | null;
  term?: number | null;
  unitCost?: { amountMicros?: number | null } | null;
  productDescription?: { markdown?: string | null } | null;
};

type RoboostProductLibraryModalProps = {
  dealCurrency: string;
  onPick: (product: RoboostLibraryProduct) => void;
  onClose: () => void;
};

// Active products only; each shows its price in the deal's currency, or the converted company price
export const RoboostProductLibraryModal = ({
  dealCurrency,
  onPick,
  onClose,
}: RoboostProductLibraryModalProps) => {
  const { t } = useLingui();
  const [search, setSearch] = useState('');
  const { activeCurrencies, companyCurrency, byCode } = useRoboostCurrencies();
  const priceFields = Object.fromEntries(
    activeCurrencies.map((currency) => [
      getRoboostPriceFieldName(currency.code),
      true,
    ]),
  );
  const { records, loading } = useFindManyRecords<RoboostLibraryProduct>({
    objectNameSingular: 'product',
    filter: {
      and: [
        { isActive: { eq: true } },
        ...(search.trim() === ''
          ? []
          : [{ name: { ilike: `%${search.trim()}%` } }]),
      ],
    },
    recordGqlFields: {
      id: true,
      name: true,
      sku: true,
      billingFrequency: true,
      term: true,
      unitCost: true,
      productDescription: true,
      ...priceFields,
    },
    orderBy: [{ name: 'AscNullsLast' }],
    limit: 50,
  });

  const describePrice = (product: RoboostLibraryProduct) => {
    const own = product[getRoboostPriceFieldName(dealCurrency)];

    if (typeof own === 'number') {
      return formatRoboostCurrencyValue(own, dealCurrency);
    }
    const companyCode = companyCurrency?.code ?? 'USD';
    const companyPrice = product[getRoboostPriceFieldName(companyCode)];
    const rate = byCode.get(dealCurrency)?.rate;

    return typeof companyPrice === 'number' && isDefined(rate) && rate > 0
      ? `${formatRoboostCurrencyValue(companyPrice / rate, dealCurrency)} · ${t`converted`}`
      : t`No price`;
  };

  return (
    <Modal title={t`Add from product library`} onClose={onClose} width={560}>
      <div className="rb-li-library">
        <Input
          variant="search"
          icon="search"
          value={search}
          placeholder={t`Search active products`}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="rb-li-library-list">
          {loading && records.length === 0 ? (
            <div className="rb-dt-empty">{t`Loading…`}</div>
          ) : records.length === 0 ? (
            <div className="rb-dt-empty">{t`No active products match.`}</div>
          ) : (
            records.map((product) => (
              <button
                key={product.id}
                type="button"
                className="rb-li-library-row"
                onClick={() => onPick(product)}
              >
                <span className="rb-li-library-name">
                  {product.name ?? t`Untitled product`}
                  {product.sku ? (
                    <span className="rb-dt-muted"> · {product.sku}</span>
                  ) : null}
                </span>
                <span className="rb-li-library-price">
                  {describePrice(product)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
