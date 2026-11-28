import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { formatRoboostCurrencyValue, isDefined } from 'twenty-shared/utils';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getRoboostPriceFieldName } from '@/roboost-app/catalog/utils/getRoboostPriceFieldName';
import { getRoboostProductPrice } from '@/roboost-app/catalog/utils/getRoboostProductPrice';
import { useRoboostCurrencies } from '@/roboost-app/currencies/hooks/useRoboostCurrencies';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { Select } from '@/roboost-ui/components/Select';

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
  onPick: (product: RoboostLibraryProduct, currencyCode: string) => void;
  onClose: () => void;
};

// Active products only; each shows its price in the chosen currency (the deal's by default), or the converted company price
export const RoboostProductLibraryModal = ({
  dealCurrency,
  onPick,
  onClose,
}: RoboostProductLibraryModalProps) => {
  const { t } = useLingui();
  const [search, setSearch] = useState('');
  const [currencyCode, setCurrencyCode] = useState(dealCurrency);
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
    const { price, isConverted } = getRoboostProductPrice({
      product,
      currencyCode,
      companyCode: companyCurrency?.code ?? 'USD',
      byCode,
    });

    if (!isDefined(price)) {
      return t`No price`;
    }

    return isConverted
      ? `${formatRoboostCurrencyValue(price, currencyCode)} · ${t`converted`}`
      : formatRoboostCurrencyValue(price, currencyCode);
  };

  return (
    <Modal title={t`Add from product library`} onClose={onClose} width={560}>
      <div className="rb-li-library">
        <div className="rb-li-library-tools">
          <Input
            variant="search"
            icon="search"
            value={search}
            placeholder={t`Search active products`}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            aria-label={t`Currency`}
            className="rb-li-library-currency"
            value={currencyCode}
            options={activeCurrencies.map(({ code }) => ({
              value: code,
              label: code,
            }))}
            onChange={setCurrencyCode}
          />
        </div>
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
                onClick={() => onPick(product, currencyCode)}
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
