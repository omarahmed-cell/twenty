import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { ROBOOST_CURRENCIES } from '@/roboost-app/currencies/graphql/roboostCurrencyQueries';
import { type RoboostCurrency } from '@/roboost-app/currencies/types/RoboostCurrency';

// The workspace currencies (archived ones included: old records still show them)
export const useRoboostCurrencies = () => {
  const { data, loading, refetch } = useQuery<{
    roboostCurrencies: RoboostCurrency[];
  }>(ROBOOST_CURRENCIES, { fetchPolicy: 'cache-first' });

  return useMemo(() => {
    const currencies = data?.roboostCurrencies ?? [];

    return {
      currencies,
      activeCurrencies: currencies.filter(({ isArchived }) => !isArchived),
      companyCurrency:
        currencies.find(({ isCompanyCurrency }) => isCompanyCurrency) ?? null,
      byCode: new Map(currencies.map((currency) => [currency.code, currency])),
      loading,
      refetch,
    };
  }, [data, loading, refetch]);
};
