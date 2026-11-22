import { FrameLogo } from '@/roboost-ui/components/FrameLogo';
import { type RoboostMode } from '@/roboost-ui/types/RoboostMode';
import { cx } from '@/roboost-ui/utils/cx';
import { getRoboostModeAttributes } from '@/roboost-ui/utils/getRoboostModeAttributes';
import { type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type AppShellProps = {
  mode: RoboostMode;
  collapsed: boolean;
  topbar?: ReactNode;
  nav?: ReactNode;
  logoHref?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

// One coloured frame (top bar + nav) with the logo where they meet; the page sits inside with a rounded corner
export const AppShell = ({
  mode,
  collapsed,
  topbar,
  nav,
  logoHref = '/',
  children,
  className,
  style,
}: AppShellProps) => (
  <div
    className={cx('rb-shell rb-ui', className)}
    {...getRoboostModeAttributes(mode)}
    data-nav={collapsed ? 'collapsed' : 'expanded'}
    style={style}
  >
    <header className="rb-shell-top">
      <Link to={logoHref} className="rb-shell-logo" aria-label="Roboost CRM">
        <FrameLogo collapsed={collapsed} />
      </Link>
      <div className="rb-topbar">{topbar}</div>
    </header>
    <div className="rb-shell-body">
      {nav !== undefined && <div className="rb-shell-nav">{nav}</div>}
      <main className="rb-shell-main">{children}</main>
    </div>
  </div>
);
