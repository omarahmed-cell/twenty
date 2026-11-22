import { useAuth } from '@/auth/hooks/useAuth';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { RoboostNewRecordMenu } from '@/roboost-app/components/RoboostNewRecordMenu';
import { getRoboostPersonName } from '@/roboost-app/utils/getRoboostPersonName';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu } from '@/roboost-ui/components/Menu';
import { RoboostSearchPopup } from '@/roboost-app/search/components/RoboostSearchPopup';
import { roboostSearchOpenState } from '@/roboost-app/search/states/roboostSearchOpenState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';

export const RoboostTopBar = () => {
  const { t } = useLingui();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const [roboostSearchOpen, setRoboostSearchOpen] = useAtomState(
    roboostSearchOpenState,
  );
  const { signOut } = useAuth();

  const memberName = getRoboostPersonName(currentWorkspaceMember?.name);

  return (
    <>
      <div className="rb-topbar-search">
        <button
          type="button"
          className="rb-topbar-search-button"
          aria-expanded={roboostSearchOpen}
          onClick={() => setRoboostSearchOpen(true)}
        >
          <Icon name="search" size={16} />
          <span className="rb-truncate">{t`Search Roboost CRM`}</span>
        </button>
        {roboostSearchOpen && (
          <RoboostSearchPopup onClose={() => setRoboostSearchOpen(false)} />
        )}
      </div>
      <span className="rb-topbar-spacer" />
      <RoboostNewRecordMenu />
      <Link
        to="/settings/profile"
        className="rb-topbar-iconbtn"
        aria-label={t`Settings`}
        title={t`Settings`}
      >
        <Icon name="settings" />
      </Link>
      {/* Notifications module is not built yet; the bell stays as a placeholder */}
      <button
        type="button"
        className="rb-topbar-iconbtn"
        aria-label={t`Notifications`}
        title={t`Notifications`}
      >
        <Icon name="bell" />
      </button>
      <Menu
        align="right"
        minWidth={220}
        header={
          <div className="rb-menu-heading" style={{ textTransform: 'none' }}>
            {memberName}
          </div>
        }
        entries={[
          {
            id: 'profile',
            label: t`Profile`,
            icon: 'user',
            href: '/settings/profile',
          },
          {
            id: 'mode',
            label: t`Mode and experience`,
            icon: 'palette',
            href: '/settings/experience',
          },
          {
            id: 'settings',
            label: t`Settings`,
            icon: 'settings',
            href: '/settings/profile',
          },
          { id: 'separator', isSeparator: true },
          {
            id: 'logout',
            label: t`Log out`,
            icon: 'logout',
            onSelect: () => {
              signOut();
            },
          },
        ]}
        trigger={({ toggle, isOpen }) => (
          <button
            type="button"
            className="rb-topbar-avatar"
            aria-label={t`Your account`}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            onClick={toggle}
          >
            <Avatar
              name={memberName}
              src={currentWorkspaceMember?.avatarUrl}
              size="sm"
              tone="accent"
            />
          </button>
        )}
      />
    </>
  );
};
