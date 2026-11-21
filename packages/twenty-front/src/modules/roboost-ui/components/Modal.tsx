import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type ModalProps = {
  open?: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  tone?: 'default' | 'danger';
  footer?: ReactNode;
  onClose?: () => void;
  inline?: boolean;
  width?: number;
  children?: ReactNode;
  className?: string;
};

export const Modal = ({
  open = true,
  title,
  subtitle,
  tone = 'default',
  footer,
  onClose,
  inline = false,
  width,
  children,
  className,
}: ModalProps) => {
  const { t } = useLingui();

  if (!open) {
    return null;
  }

  const modal = (
    <div
      className="rb-modal-scrim rb-ui"
      style={{ position: inline ? 'absolute' : 'fixed' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose?.();
        }
      }}
    >
      <div
        className={cx('rb-modal', className)}
        style={width !== undefined ? { maxWidth: width } : undefined}
        role="dialog"
        aria-modal="true"
      >
        <div className="rb-modal-head">
          {tone === 'danger' && (
            <span className="rb-modal-icon is-danger">
              <Icon name="alert-triangle" />
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="rb-modal-title">{title}</div>
            {subtitle !== undefined && (
              <div className="rb-modal-sub">{subtitle}</div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon="x"
            aria-label={t`Close`}
            onClick={onClose}
          />
        </div>
        <div className="rb-modal-body">{children}</div>
        {footer !== undefined && <div className="rb-modal-foot">{footer}</div>}
      </div>
    </div>
  );

  return inline ? modal : createPortal(modal, document.body);
};
