import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { styled } from '@linaria/react';
import { type CSSProperties, type ReactNode } from 'react';

const StyledShell = styled.div`
  -webkit-font-smoothing: antialiased;
  background: ${ROBOOST_UI_THEME.canvas};
  color: ${ROBOOST_UI_THEME.text};
  display: flex;
  flex-direction: column;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 14px;
  height: 100%;
  line-height: 20px;
  min-height: 0;
  overflow: hidden;
  width: 100%;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
`;

const StyledTop = styled.header`
  align-items: center;
  background: ${ROBOOST_UI_THEME.surface};
  border-bottom: 1px solid ${ROBOOST_UI_THEME.border};
  display: flex;
  flex: none;
  gap: 12px;
  height: 56px;
  padding: 0 16px;
`;

const StyledBody = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
`;

const StyledNavSlot = styled.div`
  display: flex;
  flex: none;
  position: relative;
  z-index: 2;
`;

const StyledMain = styled.main`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: auto;
`;

export type AppShellProps = {
  topbar?: ReactNode;
  nav?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export const AppShell = ({
  topbar,
  nav,
  children,
  className,
  style,
}: AppShellProps) => (
  <StyledShell className={className} style={style}>
    {topbar !== undefined && <StyledTop>{topbar}</StyledTop>}
    <StyledBody>
      {nav !== undefined && <StyledNavSlot>{nav}</StyledNavSlot>}
      <StyledMain>{children}</StyledMain>
    </StyledBody>
  </StyledShell>
);
