import { Icon } from '@/roboost-ui/components/Icon';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type SidePanelProps = {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  className?: string;
};

export const SidePanel = ({
  title,
  onClose,
  children,
  footer,
  width = 560,
  className,
}: SidePanelProps) => {
  const { t } = useLingui();

  return createPortal(
    <div
      className="rb-ui rb-cpanel-layer"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
    >
      <div className="rb-cscrim" onClick={onClose} />
      <div
        className={cx('rb-cpanel rb-spanel', className)}
        role="dialog"
        aria-modal="true"
        style={{ width }}
      >
        <div className="rb-cpanel-head">
          <div className="rb-cpanel-title">{title}</div>
          <button
            type="button"
            className="rb-cpanel-close"
            aria-label={t`Close`}
            onClick={onClose}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="rb-spanel-body">{children}</div>
        {footer !== undefined && <div className="rb-cpanel-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};
