import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useToast } from 'twenty-ui/components/feedback';

import {
  ROBOOST_RUN_EXCHANGE_RATE_UPDATE,
  ROBOOST_SET_EXCHANGE_RATE_APP_ID,
  ROBOOST_TEST_EXCHANGE_RATE_CONNECTION,
} from '@/roboost-app/currencies/graphql/roboostCurrencyQueries';
import { type RoboostCurrencyStatus } from '@/roboost-app/currencies/types/RoboostCurrency';
import { Button } from '@/roboost-ui/components/Button';
import { Field } from '@/roboost-ui/components/Field';
import { Input } from '@/roboost-ui/components/Input';

type RoboostExchangeRateSourceCardProps = {
  status: RoboostCurrencyStatus | undefined;
  onChanged: () => Promise<void> | void;
};

// The App ID is write-only: the page only ever sees a masked tail
export const RoboostExchangeRateSourceCard = ({
  status,
  onChanged,
}: RoboostExchangeRateSourceCardProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [appId, setAppId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveAppId, { loading: isSaving }] = useMutation(
    ROBOOST_SET_EXCHANGE_RATE_APP_ID,
  );
  const [testConnection, { loading: isTesting }] = useMutation<{
    roboostTestExchangeRateConnection: { ok: boolean; message: string };
  }>(ROBOOST_TEST_EXCHANGE_RATE_CONNECTION);
  const [runUpdate, { loading: isRunning }] = useMutation<{
    roboostRunExchangeRateUpdate: { status: string; message: string | null };
  }>(ROBOOST_RUN_EXCHANGE_RATE_UPDATE);

  const showError = (error: unknown) =>
    enqueueToast({
      status: 'error',
      children: error instanceof Error ? error.message : String(error),
    });

  const handleSave = async () => {
    try {
      await saveAppId({ variables: { appId } });
      setAppId('');
      setIsEditing(false);
      enqueueToast({ status: 'success', children: t`App ID saved` });
      await onChanged();
    } catch (error) {
      showError(error);
    }
  };

  const handleTest = async () => {
    try {
      const { data } = await testConnection();
      const result = data?.roboostTestExchangeRateConnection;

      enqueueToast({
        status: result?.ok === true ? 'success' : 'error',
        children: result?.message ?? t`No answer`,
      });
    } catch (error) {
      showError(error);
    }
  };

  const handleRun = async () => {
    try {
      const { data } = await runUpdate();
      const run = data?.roboostRunExchangeRateUpdate;

      enqueueToast({
        status: run?.status === 'COMPLETED' ? 'success' : 'error',
        children:
          run?.status === 'COMPLETED'
            ? t`Rates updated: ${run.message ?? ''}`
            : (run?.message ?? t`The update did not run`),
      });
      await onChanged();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <div className="rb-dt-card rb-cur-source">
      <div className="rb-dt-card-head">
        <div>
          <h3 className="rb-dt-title">{t`Exchange rate source`}</h3>
          <p className="rb-dt-sub">
            {t`Open Exchange Rates (openexchangerates.org), base USD. Fetched once a day at 01:00 UTC when an update is due.`}
          </p>
        </div>
      </div>
      <div className="rb-cur-source-row">
        {isEditing || status?.hasAppId !== true ? (
          <Field
            label={t`App ID`}
            hint={t`Stored encrypted. It is never shown again after saving.`}
          >
            <div className="rb-cur-inline">
              <Input
                type="text"
                value={appId}
                placeholder={t`Paste the App ID`}
                onChange={(event) => setAppId(event.target.value)}
              />
              <Button
                variant="primary"
                disabled={appId.trim() === '' || isSaving}
                onClick={handleSave}
              >
                {t`Save`}
              </Button>
              {status?.hasAppId === true && (
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  {t`Cancel`}
                </Button>
              )}
            </div>
          </Field>
        ) : (
          <Field label={t`App ID`}>
            <div className="rb-cur-inline">
              <Input value={status.appIdMasked ?? '••••••••'} disabled />
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                {t`Replace`}
              </Button>
            </div>
          </Field>
        )}
        <div className="rb-cur-inline">
          <Button
            variant="secondary"
            icon="refresh"
            disabled={status?.hasAppId !== true || isTesting}
            onClick={handleTest}
          >
            {t`Test connection`}
          </Button>
          <Button
            variant="secondary"
            disabled={status?.hasAppId !== true || isRunning}
            onClick={handleRun}
          >
            {t`Update rates now`}
          </Button>
        </div>
      </div>
    </div>
  );
};
