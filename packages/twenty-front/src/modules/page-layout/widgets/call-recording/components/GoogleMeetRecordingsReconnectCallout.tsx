import { t } from '@lingui/core/macro';
import { ConnectedAccountProvider } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { Callout, useToast } from 'twenty-ui/components/feedback';

import { GOOGLE_MEET_RECORDINGS_SCOPES } from '@/accounts/constants/GoogleMeetRecordingsScopes';
import { useMyConnectedAccounts } from '@/settings/accounts/hooks/useMyConnectedAccounts';
import { useTriggerApisOAuth } from '@/settings/accounts/hooks/useTriggerApiOAuth';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { PermissionFlagType } from '~/generated-metadata/graphql';

const GOOGLE_PROVIDERS: ReadonlySet<ConnectedAccountProvider> = new Set([
  ConnectedAccountProvider.GOOGLE,
]);

export const GoogleMeetRecordingsReconnectCallout = () => {
  const { accounts } = useMyConnectedAccounts({ providers: GOOGLE_PROVIDERS });
  const { triggerApisOAuth } = useTriggerApisOAuth();
  const hasConnectedAccountsPermission = useHasPermissionFlag(
    PermissionFlagType.CONNECTED_ACCOUNTS,
  );
  const { enqueueToast } = useToast();

  const accountMissingScopes = accounts.find(
    (account) =>
      !GOOGLE_MEET_RECORDINGS_SCOPES.every(
        (scope) => account.scopes?.includes(scope) ?? false,
      ),
  );

  if (!isDefined(accountMissingScopes)) {
    return null;
  }

  const handleReconnect = async () => {
    try {
      await triggerApisOAuth(ConnectedAccountProvider.GOOGLE, {
        redirectLocation: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        loginHint: accountMissingScopes.handle,
      });
    } catch {
      enqueueToast({
        status: 'error',
        children: t`Failed to reconnect your Google account`,
      });
    }
  };

  return (
    <Callout
      status="warning"
      title={t`Google Meet recordings need approval`}
      description={
        hasConnectedAccountsPermission
          ? t`Reconnect ${accountMissingScopes.handle} to sync Meet recordings, transcripts and Gemini notes.`
          : t`Ask a workspace admin for the Sync Account permission to reconnect your Google account.`
      }
      action={
        hasConnectedAccountsPermission ? (
          <Callout.Action type="button" onClick={handleReconnect}>
            {t`Reconnect`}
          </Callout.Action>
        ) : undefined
      }
    />
  );
};
