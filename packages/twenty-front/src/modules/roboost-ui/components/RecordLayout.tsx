import { Icon } from '@/roboost-ui/components/Icon';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type CSSProperties, type ReactNode, useState } from 'react';

type RecordPanelProps = {
  side: 'left' | 'right';
  title?: ReactNode;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  isBare?: boolean;
  children?: ReactNode;
};

const RecordPanel = ({
  side,
  title,
  collapsed,
  defaultCollapsed = false,
  onToggle,
  isBare = false,
  children,
}: RecordPanelProps) => {
  const { t } = useLingui();
  const [uncontrolledCollapsed, setUncontrolledCollapsed] =
    useState(defaultCollapsed);
  const isCollapsed = collapsed ?? uncontrolledCollapsed;

  const setCollapsed = (nextCollapsed: boolean) => {
    if (collapsed === undefined) {
      setUncontrolledCollapsed(nextCollapsed);
    }
    onToggle?.(nextCollapsed);
  };

  return (
    <div
      className={cx(
        'rb-rec-col',
        `rb-rec-${side}`,
        isCollapsed && 'is-collapsed',
      )}
    >
      <div className={cx('rb-rec-panel', isBare && 'is-bare')}>
        {title !== undefined && (
          <div className="rb-rec-panel-head">
            <span className="rb-rec-panel-title">{title}</span>
            <button
              type="button"
              className="rb-rec-collapse"
              aria-label={t`Collapse panel`}
              onClick={() => setCollapsed(true)}
            >
              <Icon
                name={side === 'left' ? 'chevron-left' : 'chevron-right'}
                size={16}
              />
            </button>
          </div>
        )}
        <div className="rb-rec-panel-body">{children}</div>
      </div>
      {side === 'right' && (
        <button
          type="button"
          className="rb-rec-edge-toggle"
          aria-label={isCollapsed ? t`Expand sidebar` : t`Collapse sidebar`}
          aria-expanded={!isCollapsed}
          data-tooltip={isCollapsed ? t`Expand sidebar` : t`Collapse sidebar`}
          onClick={() => setCollapsed(!isCollapsed)}
        >
          <Icon name="columns" size={14} />
        </button>
      )}
      <button
        type="button"
        className="rb-rec-rail"
        aria-label={t`Expand panel`}
        onClick={() => setCollapsed(false)}
      >
        <Icon
          name={side === 'left' ? 'chevron-right' : 'chevron-left'}
          size={16}
        />
      </button>
    </div>
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
  // Panels hold their own containers instead of one card
  isBare?: boolean;
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
  isBare = false,
  className,
  style,
}: RecordLayoutProps) => (
  <div className={cx('rb-rec', className)} style={style}>
    <RecordPanel
      side="left"
      title={leftTitle}
      collapsed={leftCollapsed}
      defaultCollapsed={leftDefaultCollapsed}
      onToggle={onLeftToggle}
      isBare={isBare}
    >
      {left}
    </RecordPanel>
    <div className="rb-rec-main">{middle}</div>
    <RecordPanel
      side="right"
      title={rightTitle}
      collapsed={rightCollapsed}
      defaultCollapsed={rightDefaultCollapsed}
      onToggle={onRightToggle}
      isBare={isBare}
    >
      {right}
    </RecordPanel>
  </div>
);
