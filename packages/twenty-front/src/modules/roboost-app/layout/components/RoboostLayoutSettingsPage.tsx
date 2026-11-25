import { RoboostFormsSettingsPage } from '@/roboost-app/forms/components/RoboostFormsSettingsPage';
import { RoboostRecordViewSettings } from '@/roboost-app/layout/components/RoboostRecordViewSettings';
import {
  getRoboostFormsSettingsPath,
  getRoboostRecordViewSettingsPath,
} from '@/roboost-app/layout/utils/getRoboostLayoutSettingsPath';
import { Tabs } from '@/roboost-ui/components/Tabs';
import { useLingui } from '@lingui/react/macro';
import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import { Link, Navigate, useNavigate } from 'react-router-dom';

type RoboostLayoutSettingsTab = 'forms' | 'record-view';

type RoboostLayoutSettingsPageProps = {
  tab: RoboostLayoutSettingsTab;
};

// Settings → Layout: the create forms and the record page of every object
export const RoboostLayoutSettingsPage = ({
  tab,
}: RoboostLayoutSettingsPageProps) => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const access = useRoboostAccess();
  const tabLabel = tab === 'forms' ? t`Forms` : t`Record view`;

  // Forms are admin-only; Record view needs Customize cards
  if (access.isLoaded && !access.isAdmin) {
    if (!access.hasToggle('customizeCards')) {
      return <Navigate to="/settings/profile" replace />;
    }

    if (tab === 'forms') {
      return <Navigate to={getRoboostRecordViewSettingsPath()} replace />;
    }
  }

  const tabs = [
    ...(access.isAdmin || !access.isLoaded
      ? [{ id: 'forms', label: t`Forms` }]
      : []),
    { id: 'record-view', label: t`Record view` },
  ];

  return (
    <div className="rb-ui rb-forms-page">
      <div className="rb-forms-crumbs">
        <Link to="/settings/profile">{t`Settings`}</Link>
        <span>/</span>
        <Link to={getRoboostFormsSettingsPath()}>{t`Layout`}</Link>
        <span>/</span>
        <b>{tabLabel}</b>
      </div>
      <h1 className="rb-forms-title">{t`Layout`}</h1>
      <Tabs
        className="rb-layout-tabs"
        tabs={tabs}
        value={tab}
        onChange={(id) =>
          navigate(
            id === 'forms'
              ? getRoboostFormsSettingsPath()
              : getRoboostRecordViewSettingsPath(),
          )
        }
      />
      {tab === 'forms' ? (
        <RoboostFormsSettingsPage />
      ) : (
        <RoboostRecordViewSettings />
      )}
    </div>
  );
};
