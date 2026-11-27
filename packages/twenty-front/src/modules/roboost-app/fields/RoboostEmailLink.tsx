import { useFirstConnectedAccount } from '@/activities/emails/hooks/useFirstConnectedAccount';
import {
  type RoboostEmailContextRecord,
  RoboostEmailContextRecordContext,
} from '@/roboost-app/fields/contexts/RoboostEmailContextRecordContext';
import { useOpenComposeEmailInSidePanel } from '@/side-panel/hooks/useOpenComposeEmailInSidePanel';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { useContext } from 'react';
import { SettingsPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';

type RoboostEmailLinkProps = {
  email: string;
  // The record the email belongs to; a record page's own record wins
  record?: RoboostEmailContextRecord;
  className?: string;
};

// Opens our email composer addressed to this email, never a mailto: link
export const RoboostEmailLink = ({
  email,
  record,
  className,
}: RoboostEmailLinkProps) => {
  const { t } = useLingui();
  const pageRecord = useContext(RoboostEmailContextRecordContext);
  const { connectedAccountId } = useFirstConnectedAccount();
  const { openComposeEmailInSidePanel } = useOpenComposeEmailInSidePanel();
  const navigateSettings = useNavigateSettings();
  const contextRecord = pageRecord ?? record;

  return (
    <button
      type="button"
      className={cx('rb-email-link', className)}
      title={t`Email ${email}`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        if (!isDefined(connectedAccountId)) {
          navigateSettings(SettingsPath.NewAccount);
          return;
        }
        openComposeEmailInSidePanel({
          connectedAccountId,
          defaultTo: email,
          contextRecord: contextRecord ?? undefined,
        });
      }}
    >
      {email}
    </button>
  );
};
