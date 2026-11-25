import { RoboostTeamsTab } from '@/roboost-app/users-and-teams/components/RoboostTeamsTab';
import { RoboostUsersTab } from '@/roboost-app/users-and-teams/components/RoboostUsersTab';
import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import {
  getRoboostTeamsPath,
  getRoboostUsersPath,
} from '@/roboost-app/users-and-teams/utils/getRoboostUsersAndTeamsPath';
import { Tabs } from '@/roboost-ui/components/Tabs';
import { useLingui } from '@lingui/react/macro';
import { Link, Navigate, useNavigate } from 'react-router-dom';

type RoboostUsersAndTeamsPageProps = {
  tab: 'users' | 'teams';
};

export const RoboostUsersAndTeamsPage = ({
  tab,
}: RoboostUsersAndTeamsPageProps) => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const access = useRoboostAccess();

  if (access.isLoaded && !access.canSeeUserTable) {
    return <Navigate to="/settings/profile" replace />;
  }

  const tabLabel = tab === 'users' ? t`Users` : t`Teams`;

  return (
    <div className="rb-ui rb-forms-page rb-ut-page">
      <div className="rb-forms-crumbs">
        <Link to="/settings/profile">{t`Settings`}</Link>
        <span>/</span>
        <Link to={getRoboostUsersPath()}>{t`Users & Teams`}</Link>
        <span>/</span>
        <b>{tabLabel}</b>
      </div>
      <h1 className="rb-forms-title">{t`Users & Teams`}</h1>
      <Tabs
        className="rb-layout-tabs"
        tabs={[
          { id: 'users', label: t`Users` },
          { id: 'teams', label: t`Teams` },
        ]}
        value={tab}
        onChange={(id) =>
          navigate(
            id === 'users' ? getRoboostUsersPath() : getRoboostTeamsPath(),
          )
        }
      />
      {tab === 'users' ? (
        <RoboostUsersTab />
      ) : (
        <RoboostTeamsTab isAdmin={access.isAdmin} />
      )}
    </div>
  );
};
