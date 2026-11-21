import { Icon } from '@/roboost-ui/components/Icon';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';

type ToastTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const ICON_BY_TONE: Record<ToastTone, RoboostIconName> = {
  success: 'check-circle',
  danger: 'alert-triangle',
  warning: 'alert-triangle',
  info: 'info',
  neutral: 'info',
};

export type ToastProps = {
  tone?: ToastTone;
  title?: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
  children?: ReactNode;
};

export const Toast = ({
  tone = 'neutral',
  title,
  action,
  onClose,
  children,
}: ToastProps) => {
  const { t } = useLingui();

  return (
    <div className={cx('rb-toast', `rb-toast-${tone}`)} role="status">
      <span className="rb-toast-icon">
        <Icon name={ICON_BY_TONE[tone]} />
      </span>
      <div className="rb-toast-main">
        {title !== undefined && <div className="rb-toast-title">{title}</div>}
        {children !== undefined && (
          <div className="rb-toast-msg">{children}</div>
        )}
        {action !== undefined && (
          <div className="rb-toast-action">{action}</div>
        )}
      </div>
      {onClose !== undefined && (
        <button
          type="button"
          className="rb-toast-close"
          aria-label={t`Dismiss`}
          onClick={onClose}
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
};
