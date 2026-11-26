import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';

import { ROBOOST_CURRENCY_SETTINGS_HISTORY } from '@/roboost-app/currencies/graphql/roboostCurrencyQueries';
import { Modal } from '@/roboost-ui/components/Modal';

type HistoryEntry = {
  id: string;
  action: string;
  detail: string;
  actorName: string | null;
  createdAt: string;
};

type RoboostCurrencyHistoryModalProps = {
  onClose: () => void;
};

export const RoboostCurrencyHistoryModal = ({
  onClose,
}: RoboostCurrencyHistoryModalProps) => {
  const { t } = useLingui();
  const { data, loading } = useQuery<{
    roboostCurrencySettingsHistory: HistoryEntry[];
  }>(ROBOOST_CURRENCY_SETTINGS_HISTORY, { fetchPolicy: 'network-only' });

  const describe = (entry: HistoryEntry) => {
    const detail = JSON.parse(entry.detail) as Record<string, unknown>;
    const to = detail.to as { frequency?: string } | undefined;

    switch (entry.action) {
      case 'AUTO_UPDATE_ON':
        return t`Turned automatic updates on`;
      case 'AUTO_UPDATE_OFF':
        return t`Turned automatic updates off`;
      case 'FREQUENCY_CHANGED':
        return t`Changed the frequency to ${String(to?.frequency ?? '').toLowerCase()}`;
      case 'APP_ID_SET':
        return t`Saved the Open Exchange Rates App ID`;
      case 'APP_ID_REMOVED':
        return t`Removed the Open Exchange Rates App ID`;
      case 'CURRENCY_ADDED':
        return t`Added ${String(detail.code)} at ${String(detail.rate)}`;
      case 'CURRENCY_ARCHIVED':
        return t`Archived ${String(detail.code)}`;
      case 'CURRENCY_UNARCHIVED':
        return t`Unarchived ${String(detail.code)}`;
      case 'RATE_SET':
        return t`Set ${String(detail.code)} to ${String(detail.rate)} from ${String(detail.effectiveDate)}`;
      case 'COMPANY_CURRENCY_CHANGED':
        return t`Changed the company currency from ${String(detail.from)} to ${String(detail.to)}`;
      case 'UPDATE_RUN_NOW':
        return t`Ran an update now (${String(detail.status).toLowerCase()})`;
      default:
        return entry.action;
    }
  };

  return (
    <Modal title={t`Currency settings history`} onClose={onClose} width={640}>
      {loading ? (
        <div className="rb-dt-empty">{t`Loading…`}</div>
      ) : (data?.roboostCurrencySettingsHistory ?? []).length === 0 ? (
        <div className="rb-dt-empty">{t`No changes yet.`}</div>
      ) : (
        <div className="rb-dt-table-wrap">
          <table className="rb-dt-table">
            <thead>
              <tr>
                <th>{t`When`}</th>
                <th>{t`Who`}</th>
                <th>{t`What`}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.roboostCurrencySettingsHistory ?? []).map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td>{entry.actorName ?? t`System`}</td>
                  <td>{describe(entry)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};
