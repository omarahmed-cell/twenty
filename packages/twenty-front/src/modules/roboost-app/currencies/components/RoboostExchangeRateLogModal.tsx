import { useLazyQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { formatRoboostCurrencyName } from 'twenty-shared/utils';

import { ROBOOST_EXCHANGE_RATE_LOG } from '@/roboost-app/currencies/graphql/roboostCurrencyQueries';
import { formatRoboostRateSource } from '@/roboost-app/currencies/utils/formatRoboostRateSource';
import { type RoboostCurrency } from '@/roboost-app/currencies/types/RoboostCurrency';
import { Button } from '@/roboost-ui/components/Button';
import { Field } from '@/roboost-ui/components/Field';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { Select } from '@/roboost-ui/components/Select';

type RateLogEntry = {
  rate: number;
  effectiveDate: string;
  source: string;
  setByName: string | null;
  createdAt: string;
};

type RoboostExchangeRateLogModalProps = {
  currencies: RoboostCurrency[];
  companyCurrencyCode: string;
  onClose: () => void;
};

export const RoboostExchangeRateLogModal = ({
  currencies,
  companyCurrencyCode,
  onClose,
}: RoboostExchangeRateLogModalProps) => {
  const { t } = useLingui();
  const [code, setCode] = useState('');
  const [date, setDate] = useState('');
  const [searchLog, { data, loading }] = useLazyQuery<{
    roboostExchangeRateLog: {
      companyCurrency: string;
      effective: RateLogEntry | null;
      history: RateLogEntry[];
    };
  }>(ROBOOST_EXCHANGE_RATE_LOG, { fetchPolicy: 'network-only' });
  const log = data?.roboostExchangeRateLog;
  const options = currencies
    .filter(({ isCompanyCurrency }) => !isCompanyCurrency)
    .map((currency) => ({
      value: currency.code,
      label: `${currency.name} (${currency.code}) ${currency.symbol}`,
    }));

  return (
    <Modal title={t`Exchange rate log`} onClose={onClose} width={600}>
      <div className="rb-cur-form">
        <Field label={t`Current company currency`}>
          <Input
            value={formatRoboostCurrencyName(companyCurrencyCode)}
            disabled
          />
        </Field>
        <Field label={t`Select currency`}>
          <Select
            options={options}
            value={code}
            onChange={setCode}
            placeholder={t`Select a currency`}
            isSearchable
          />
        </Field>
        <Field label={t`Select date`}>
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
        <div>
          <Button
            variant="secondary"
            icon="search"
            disabled={code === '' || loading}
            onClick={() =>
              searchLog({
                variables: { code, date: date === '' ? null : date },
              })
            }
          >
            {t`Search log`}
          </Button>
        </div>
        {log !== undefined && (
          <div className="rb-cur-log">
            <div className="rb-cur-log-effective">
              {log.effective === null ? (
                <span className="rb-dt-muted">
                  {t`No rate was set for ${code} on or before that date.`}
                </span>
              ) : (
                <>
                  <strong>
                    1 {code} = {log.effective.rate.toFixed(6)}{' '}
                    {log.companyCurrency}
                  </strong>
                  <span className="rb-dt-muted">
                    {t`Effective from ${log.effective.effectiveDate}`} ·{' '}
                    {formatRoboostRateSource(
                      t,
                      log.effective.source,
                      log.effective.setByName,
                    )}
                  </span>
                </>
              )}
            </div>
            <div className="rb-dt-table-wrap">
              <table className="rb-dt-table">
                <thead>
                  <tr>
                    <th>{t`Effective from`}</th>
                    <th className="is-number">{t`Rate`}</th>
                    <th>{t`Set by`}</th>
                  </tr>
                </thead>
                <tbody>
                  {log.history.map((entry) => (
                    <tr
                      key={`${entry.effectiveDate}-${entry.createdAt}`}
                      className={
                        entry === log.effective ||
                        (log.effective?.createdAt === entry.createdAt &&
                          log.effective?.effectiveDate === entry.effectiveDate)
                          ? 'is-highlighted'
                          : undefined
                      }
                    >
                      <td>{entry.effectiveDate}</td>
                      <td className="is-number">{entry.rate.toFixed(6)}</td>
                      <td>
                        {formatRoboostRateSource(
                          t,
                          entry.source,
                          entry.setByName,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
