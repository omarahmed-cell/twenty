import { Trans, useLingui } from '@lingui/react/macro';
import { Navigate } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

import { RoboostCurrenciesSettings } from '@/roboost-app/currencies/components/RoboostCurrenciesSettings';
import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';

export const SettingsRoboostCurrencies = () => {
  const { t } = useLingui();
  const roboostAccess = useRoboostAccess();

  if (roboostAccess.isLoaded && !roboostAccess.isAdmin) {
    return <Navigate to={getSettingsPath(SettingsPath.ProfilePage)} replace />;
  }

  return (
    <SettingsPageLayout
      title={t`Currencies`}
      links={[
        {
          children: <Trans>Workspace</Trans>,
          href: getSettingsPath(SettingsPath.General),
        },
        { children: <Trans>Data management</Trans> },
        { children: <Trans>Currencies</Trans> },
      ]}
    >
      <SettingsPageContainer>
        <div className="rb-ui rb-dt-page">
          {roboostAccess.isAdmin && <RoboostCurrenciesSettings />}
        </div>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
