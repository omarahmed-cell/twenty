import { cx } from '@/roboost-ui/utils/cx';

export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
};

export const Toggle = ({
  checked,
  onChange,
  disabled = false,
  'aria-label': ariaLabel,
}: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    className={cx('rb-toggle', checked && 'is-on')}
    onClick={() => onChange(!checked)}
  >
    <span className="rb-toggle-knob" />
  </button>
);
