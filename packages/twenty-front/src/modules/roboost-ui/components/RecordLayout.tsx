import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type CSSProperties, type ReactNode, useState } from 'react';

// Side panels give way by the layout's own width: the right one folds to a rail first, then the left
const StyledLayout = styled.div`
  align-items: flex-start;
  box-sizing: border-box;
  container: roboost-record / inline-size;
  display: flex;
  flex: 1 1 auto;
  gap: 20px;
  min-height: 100%;
  min-width: 0;
  padding: 20px;
  width: 100%;

  @container roboost-record (max-width: 1080px) {
    .roboost-record-right {
      flex: 0 0 40px;
      max-width: 40px;
      min-width: 0;
    }
    .roboost-record-right .roboost-record-panel {
      display: none;
    }
    .roboost-record-right .roboost-record-rail {
      display: flex;
    }
  }

  @container roboost-record (max-width: 800px) {
    .roboost-record-left {
      flex: 0 0 40px;
      max-width: 40px;
      min-width: 0;
    }
    .roboost-record-left .roboost-record-panel {
      display: none;
    }
    .roboost-record-left .roboost-record-rail {
      display: flex;
    }
  }
`;

const StyledColumn = styled.div<{
  side: 'left' | 'right';
  isCollapsed: boolean;
}>`
  align-self: stretch;
  display: flex;
  flex: ${({ side, isCollapsed }) =>
    isCollapsed ? '0 0 40px' : side === 'left' ? '0 1 320px' : '0 1 310px'};
  max-width: ${({ side, isCollapsed }) =>
    isCollapsed ? '40px' : side === 'left' ? '360px' : '340px'};
  min-width: ${({ isCollapsed }) => (isCollapsed ? '0' : '280px')};

  &[data-collapsed='true'] .roboost-record-panel {
    display: none;
  }

  &[data-collapsed='true'] .roboost-record-rail {
    display: flex;
  }
`;

const StyledPanel = styled.div`
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.border};
  border-radius: ${ROBOOST_UI_THEME.radiusMd};
  box-shadow: ${ROBOOST_UI_THEME.shadowXs};
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`;

const StyledPanelHead = styled.div`
  align-items: center;
  border-bottom: 1px solid ${ROBOOST_UI_THEME.borderSubtle};
  display: flex;
  flex: none;
  gap: 8px;
  justify-content: space-between;
  padding: 12px 16px;
`;

const StyledPanelTitle = styled.span`
  color: ${ROBOOST_UI_THEME.textMuted};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
`;

const StyledCollapse = styled.button`
  background: none;
  border: none;
  border-radius: ${ROBOOST_UI_THEME.radiusXs};
  color: ${ROBOOST_UI_THEME.textMuted};
  cursor: pointer;
  display: inline-flex;
  flex: none;
  padding: 3px;

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
    color: ${ROBOOST_UI_THEME.text};
  }
`;

const StyledPanelBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding: 16px;

  > * {
    max-width: 100%;
  }
`;

const StyledRail = styled.button`
  align-items: flex-start;
  align-self: stretch;
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.border};
  border-radius: ${ROBOOST_UI_THEME.radiusMd};
  color: ${ROBOOST_UI_THEME.textMuted};
  cursor: pointer;
  display: none;
  flex: none;
  justify-content: center;
  padding-top: 16px;
  width: 40px;

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
    color: ${ROBOOST_UI_THEME.text};
  }
`;

const StyledMain = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 16px;
  min-width: 480px;
`;

type RecordPanelProps = {
  side: 'left' | 'right';
  title?: ReactNode;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  children?: ReactNode;
};

const RecordPanel = ({
  side,
  title,
  collapsed,
  defaultCollapsed = false,
  onToggle,
  children,
}: RecordPanelProps) => {
  const { t } = useLingui();
  const [uncontrolledCollapsed, setUncontrolledCollapsed] =
    useState(defaultCollapsed);
  const isCollapsed = collapsed ?? uncontrolledCollapsed;

  const toggle = () => {
    if (collapsed === undefined) {
      setUncontrolledCollapsed(!isCollapsed);
    }
    onToggle?.(!isCollapsed);
  };

  return (
    <StyledColumn
      side={side}
      isCollapsed={isCollapsed}
      data-collapsed={isCollapsed}
      className={`roboost-record-${side}`}
    >
      <StyledPanel className="roboost-record-panel">
        {title !== undefined && (
          <StyledPanelHead>
            <StyledPanelTitle>{title}</StyledPanelTitle>
            <StyledCollapse
              type="button"
              aria-label={t`Collapse panel`}
              onClick={toggle}
            >
              <Icon
                name={side === 'left' ? 'chevron-left' : 'chevron-right'}
                size={16}
              />
            </StyledCollapse>
          </StyledPanelHead>
        )}
        <StyledPanelBody>{children}</StyledPanelBody>
      </StyledPanel>
      <StyledRail
        type="button"
        className="roboost-record-rail"
        aria-label={t`Expand panel`}
        onClick={() => {
          if (collapsed === undefined) {
            setUncontrolledCollapsed(false);
          }
          onToggle?.(false);
        }}
      >
        <Icon
          name={side === 'left' ? 'chevron-right' : 'chevron-left'}
          size={16}
        />
      </StyledRail>
    </StyledColumn>
  );
};

export type RecordLayoutProps = {
  left?: ReactNode;
  middle?: ReactNode;
  right?: ReactNode;
  leftTitle?: ReactNode;
  rightTitle?: ReactNode;
  leftCollapsed?: boolean;
  rightCollapsed?: boolean;
  leftDefaultCollapsed?: boolean;
  rightDefaultCollapsed?: boolean;
  onLeftToggle?: (collapsed: boolean) => void;
  onRightToggle?: (collapsed: boolean) => void;
  className?: string;
  style?: CSSProperties;
};

export const RecordLayout = ({
  left,
  middle,
  right,
  leftTitle,
  rightTitle,
  leftCollapsed,
  rightCollapsed,
  leftDefaultCollapsed,
  rightDefaultCollapsed,
  onLeftToggle,
  onRightToggle,
  className,
  style,
}: RecordLayoutProps) => (
  <StyledLayout className={className} style={style}>
    <RecordPanel
      side="left"
      title={leftTitle}
      collapsed={leftCollapsed}
      defaultCollapsed={leftDefaultCollapsed}
      onToggle={onLeftToggle}
    >
      {left}
    </RecordPanel>
    <StyledMain>{middle}</StyledMain>
    <RecordPanel
      side="right"
      title={rightTitle}
      collapsed={rightCollapsed}
      defaultCollapsed={rightDefaultCollapsed}
      onToggle={onRightToggle}
    >
      {right}
    </RecordPanel>
  </StyledLayout>
);
