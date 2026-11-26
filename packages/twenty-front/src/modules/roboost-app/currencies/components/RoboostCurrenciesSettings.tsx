import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { formatRoboostCurrencyValue } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

import { RoboostAddCurrencyModal } from '@/roboost-app/currencies/components/RoboostAddCurrencyModal';
import { RoboostCompanyCurrencyModal } from '@/roboost-app/currencies/components/RoboostCompanyCurrencyModal';
import { RoboostCurrencyHistoryModal } from '@/roboost-app/currencies/components/RoboostCurrencyHistoryModal';
import { RoboostEditRateModal } from '@/roboost-app/currencies/components/RoboostEditRateModal';
import { RoboostExchangeRateLogModal } from '@/roboost-app/currencies/components/RoboostExchangeRateLogModal';
import { RoboostExchangeRateSourceCard } from '@/roboost-app/currencies/components/RoboostExchangeRateSourceCard';
import { RoboostRateFrequencyModal } from '@/roboost-app/currencies/components/RoboostRateFrequencyModal';
import {
  ROBOOST_CURRENCY_STATUS,
  ROBOOST_SET_CURRENCY_ARCHIVED,
  ROBOOST_SET_CURRENCY_AUTO_UPDATE,
} from '@/roboost-app/currencies/graphql/roboostCurrencyQueries';
import { useRoboostCurrencies } from '@/roboost-app/currencies/hooks/useRoboostCurrencies';
import {
  type RoboostCurrency,
  type RoboostCurrencyStatus,
} from '@/roboost-app/currencies/types/RoboostCurrency';
import { formatRoboostRateSource } from '@/roboost-app/currencies/utils/formatRoboostRateSource';
import { Button } from '@/roboost-ui/components/Button';
import { Tag } from '@/roboost-ui/components/Tag';
import { Toggle } from '@/roboost-ui/components/Toggle';

type OpenModal =
  | { kind: 'add' }
  | { kind: 'log' }
  | { kind: 'frequency' }
  | { kind: 'history' }
  | { kind: 'rate'; currency: RoboostCurrency }
  | { kind: 'company'; currency: RoboostCurrency }
  | null;

const formatDate = (value: string | null) =>
  value === null
    ? ''
    : new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString(
        undefined,
        {
          timeZone: 'UTC',
        },
      );

export const RoboostCurrenciesSettings = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { currencies, companyCurrency, refetch } = useRoboostCurrencies();
  const { data: statusData, refetch: refetchStatus } = useQuery<{
    roboostCurrencyStatus: RoboostCurrencyStatus;
  }>(ROBOOST_CURRENCY_STATUS, { fetchPolicy: 'cache-and-network' });
  const [setAutoUpdate] = useMutation(ROBOOST_SET_CURRENCY_AUTO_UPDATE);
  const [setArchived] = useMutation(ROBOOST_SET_CURRENCY_ARCHIVED);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const status = statusData?.roboostCurrencyStatus;
  const companyCode = companyCurrency?.code ?? 'USD';
  const activeCount = currencies.filter(({ isArchived }) => !isArchived).length;
  const frequencyLabels: Record<RoboostCurrencyStatus['frequency'], string> = {
    DAILY: t`Daily`,
    MONTHLY: t`Monthly`,
    QUARTERLY: t`Quarterly`,
    YEARLY: t`Yearly`,
  };

  const refreshAll = async () => {
    setOpenModal(null);
    await Promise.all([refetch(), refetchStatus()]);
  };

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      enqueueToast({ status: 'success', children: success });
      await refreshAll();
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const describeRun = () => {
    const lastRun = status?.lastRun;

    if (!status?.autoUpdateEnabled) {
      return t`Automatic updates are off`;
    }
    if (lastRun === null || lastRun === undefined) {
      return t`No update has run yet · Next update on ${formatDate(status.nextUpdateOn)}`;
    }
    const next = t`Next update on ${formatDate(status.nextUpdateOn)}`;

    switch (lastRun.status) {
      case 'COMPLETED':
      case 'NOT_DUE':
        return `${t`Completed on ${formatDate(status.lastSuccessAt ?? lastRun.at)}`} · ${next}`;
      case 'NO_APP_ID':
        return `${t`Waiting for an App ID`} · ${next}`;
      case 'FAILED':
        return `${t`Failed on ${formatDate(lastRun.at)}: the last rates are kept`} · ${next}`;
      default:
        return next;
    }
  };

  const missingCodes = status?.lastRun?.missingCodes ?? [];

  return (
    <div className="rb-cur-page">
      <div className="rb-dt-card rb-cur-auto">
        <div className="rb-cur-auto-main">
          <h3 className="rb-dt-title">{t`Automatic exchange rate updates`}</h3>
          <p className="rb-dt-sub">
            <strong>{t`Frequency:`}</strong>{' '}
            {frequencyLabels[status?.frequency ?? 'DAILY']} ·{' '}
            <strong>{t`Update status:`}</strong> {describeRun()}
          </p>
          <div className="rb-cur-auto-actions">
            <Button
              variant="secondary"
              size="sm"
              icon="history"
              onClick={() => setOpenModal({ kind: 'history' })}
            >
              {t`View history`}
            </Button>
          </div>
        </div>
        <div className="rb-cur-auto-controls">
          <Toggle
            checked={status?.autoUpdateEnabled ?? true}
            onChange={(enabled) =>
              run(
                () =>
                  setAutoUpdate({
                    variables: {
                      enabled,
                      frequency: status?.frequency ?? 'DAILY',
                    },
                  }),
                enabled
                  ? t`Automatic updates turned on`
                  : t`Automatic updates turned off`,
              )
            }
          />
          <Button
            variant="secondary"
            size="sm"
            icon="pencil"
            iconOnly
            title={t`Change frequency`}
            onClick={() => setOpenModal({ kind: 'frequency' })}
          />
        </div>
      </div>

      <RoboostExchangeRateSourceCard status={status} onChanged={refreshAll} />

      <div className="rb-cur-head">
        <h2 className="rb-dt-heading">{t`All currencies`}</h2>
        <div className="rb-cur-head-actions">
          <span className="rb-dt-muted">{t`Currencies used: ${activeCount}`}</span>
          <Button
            variant="secondary"
            onClick={() => setOpenModal({ kind: 'log' })}
          >
            {t`Exchange rate log`}
          </Button>
          <Button
            variant="primary"
            icon="plus"
            onClick={() => setOpenModal({ kind: 'add' })}
          >
            {t`Add currency`}
          </Button>
        </div>
      </div>
      <div className="rb-cur-info">
        {t`Open records (including deals) use these exchange rates. Closed records use the exchange rate on their close date.`}
      </div>

      <div className="rb-dt-table-wrap">
        <table className="rb-dt-table rb-cur-table">
          <thead>
            <tr>
              <th>{t`Name`}</th>
              <th className="is-number">{t`Exchange rate`}</th>
              <th>{t`Format`}</th>
              <th>{t`Last updated`}</th>
              <th aria-label={t`Actions`} />
            </tr>
          </thead>
          <tbody>
            {currencies.map((currency) => (
              <tr
                key={currency.code}
                className={currency.isArchived ? 'is-archived' : undefined}
              >
                <td>
                  <span className="rb-cur-name">
                    {currency.name} ({currency.code}) {currency.symbol}
                  </span>
                  {currency.isArchived && (
                    <Tag tone="neutral">{t`Archived`}</Tag>
                  )}
                </td>
                <td className="is-number">
                  {currency.isCompanyCurrency ? (
                    <Tag tone="success">{t`Company currency`}</Tag>
                  ) : (
                    currency.rate.toFixed(6)
                  )}
                </td>
                <td>{formatRoboostCurrencyValue(123456.78, currency.code)}</td>
                <td>
                  {currency.isCompanyCurrency ? (
                    <span className="rb-cur-updated">
                      <span>{formatDate(currency.addedAt)}</span>
                      <span className="rb-dt-muted">{t`Company currency`}</span>
                    </span>
                  ) : (
                    <span className="rb-cur-updated">
                      <span>{formatDate(currency.rateDate)}</span>
                      <span className="rb-dt-muted">
                        {formatRoboostRateSource(
                          t,
                          currency.rateSource,
                          currency.setByName,
                        )}
                      </span>
                    </span>
                  )}
                </td>
                <td className="rb-cur-row-actions">
                  {!currency.isCompanyCurrency && !currency.isArchived && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpenModal({ kind: 'rate', currency })}
                      >
                        {t`Edit rate`}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          run(
                            () =>
                              setArchived({
                                variables: {
                                  code: currency.code,
                                  isArchived: true,
                                },
                              }),
                            t`${currency.code} archived`,
                          )
                        }
                      >
                        {t`Archive`}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setOpenModal({ kind: 'company', currency })
                        }
                      >
                        {t`Make company currency`}
                      </Button>
                    </>
                  )}
                  {currency.isArchived && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        run(
                          () =>
                            setArchived({
                              variables: {
                                code: currency.code,
                                isArchived: false,
                              },
                            }),
                          t`${currency.code} unarchived`,
                        )
                      }
                    >
                      {t`Unarchive`}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {missingCodes.length > 0 && (
        <div className="rb-dt-card rb-cur-missing">
          <h3 className="rb-dt-title">{t`Currencies requiring manual updates`}</h3>
          <p className="rb-dt-sub">
            {t`The rate provider did not return these currencies. Set their rate by hand with Edit rate:`}{' '}
            <strong>{missingCodes.join(', ')}</strong>
          </p>
        </div>
      )}

      {status !== undefined && (
        <p className="rb-dt-muted rb-cur-footnote">
          {t`Every rate is kept with its effective date. Currency data uses ${Math.max(1, Math.round(status.storageBytes / 1024))} KB.`}
        </p>
      )}

      {openModal?.kind === 'add' && (
        <RoboostAddCurrencyModal
          currencies={currencies}
          companyCurrencyCode={companyCode}
          onClose={() => setOpenModal(null)}
          onAdded={refreshAll}
        />
      )}
      {openModal?.kind === 'rate' && (
        <RoboostEditRateModal
          currency={openModal.currency}
          companyCurrencyCode={companyCode}
          onClose={() => setOpenModal(null)}
          onSaved={refreshAll}
        />
      )}
      {openModal?.kind === 'company' && (
        <RoboostCompanyCurrencyModal
          currency={openModal.currency}
          companyCurrencyCode={companyCode}
          onClose={() => setOpenModal(null)}
          onChanged={refreshAll}
        />
      )}
      {openModal?.kind === 'log' && (
        <RoboostExchangeRateLogModal
          currencies={currencies}
          companyCurrencyCode={companyCode}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal?.kind === 'history' && (
        <RoboostCurrencyHistoryModal onClose={() => setOpenModal(null)} />
      )}
      {openModal?.kind === 'frequency' && (
        <RoboostRateFrequencyModal
          frequency={status?.frequency ?? 'DAILY'}
          onClose={() => setOpenModal(null)}
          onSave={(frequency) =>
            run(
              () =>
                setAutoUpdate({
                  variables: {
                    enabled: status?.autoUpdateEnabled ?? true,
                    frequency,
                  },
                }),
              t`Frequency updated`,
            )
          }
        />
      )}
    </div>
  );
};
