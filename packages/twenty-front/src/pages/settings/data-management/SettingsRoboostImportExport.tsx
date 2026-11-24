import { RoboostExportAuditSection } from '@/roboost-app/data-transfer/components/RoboostExportAuditSection';
import { RoboostImportsSection } from '@/roboost-app/data-transfer/components/RoboostImportsSection';
import { RoboostLargeExportThreshold } from '@/roboost-app/data-transfer/components/RoboostLargeExportThreshold';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { Trans, useLingui } from '@lingui/react/macro';
import { useSearchParams } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

export const SettingsRoboostImportExport = () => {
  const { t } = useLingui();
  const [searchParams] = useSearchParams();

  return (
    <SettingsPageLayout
      title={t`Import & Export`}
      links={[
        {
          children: <Trans>Workspace</Trans>,
          href: getSettingsPath(SettingsPath.General),
        },
        { children: <Trans>Data management</Trans> },
        { children: <Trans>Import & Export</Trans> },
      ]}
    >
      <SettingsPageContainer>
        <div className="rb-ui rb-dt-page">
          <div className="rb-dt-card rb-dt-intro">
            <div>
              <h3 className="rb-dt-title">{t`Import data`}</h3>
              <p className="rb-dt-sub">{t`Start an import from the Import button on any list (Companies, Contacts, Deals, Services). Every run is logged below.`}</p>
            </div>
          </div>
          <h2 className="rb-dt-heading">{t`Export`}</h2>
          <RoboostLargeExportThreshold />
          <RoboostExportAuditSection
            highlightedId={searchParams.get('export')}
          />
          <h2 className="rb-dt-heading">{t`Import`}</h2>
          <RoboostImportsSection highlightedId={searchParams.get('import')} />
        </div>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
