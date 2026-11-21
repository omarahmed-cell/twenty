import { Icon } from '@/roboost-ui/components/Icon';
import { cx } from '@/roboost-ui/utils/cx';
import { type ReactNode } from 'react';

export type FieldProps = {
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export const Field = ({
  label,
  required,
  hint,
  error,
  children,
  className,
}: FieldProps) => (
  <label className={cx('rb-field', className)}>
    {label !== undefined && (
      <span className="rb-field-label">
        {label}
        {required === true && <span className="rb-req">*</span>}
      </span>
    )}
    {children}
    {error !== undefined ? (
      <span className="rb-field-error">
        <Icon name="alert-triangle" size={14} />
        {error}
      </span>
    ) : (
      hint !== undefined && <span className="rb-field-hint">{hint}</span>
    )}
  </label>
);
