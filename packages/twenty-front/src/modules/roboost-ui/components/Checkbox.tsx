import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { styled } from '@linaria/react';
import { type ChangeEvent, type ReactNode, useState } from 'react';

const StyledLabel = styled.label<{ isDisabled: boolean }>`
  align-items: center;
  color: ${({ isDisabled }) =>
    isDisabled ? ROBOOST_UI_THEME.textDisabled : ROBOOST_UI_THEME.text};
  cursor: ${({ isDisabled }) => (isDisabled ? 'not-allowed' : 'pointer')};
  display: inline-flex;
  font-size: 14px;
  gap: 8px;
  user-select: none;

  input {
    height: 0;
    opacity: 0;
    position: absolute;
    width: 0;
  }

  input:focus-visible + span {
    box-shadow: ${ROBOOST_UI_THEME.shadowFocus};
  }
`;

const StyledBox = styled.span<{ isOn: boolean; isDisabled: boolean }>`
  align-items: center;
  background: ${({ isOn, isDisabled }) =>
    isDisabled
      ? ROBOOST_UI_THEME.surfaceSunken
      : isOn
        ? ROBOOST_UI_THEME.accent
        : ROBOOST_UI_THEME.surface};
  border: 1px solid
    ${({ isOn, isDisabled }) =>
      isDisabled
        ? ROBOOST_UI_THEME.border
        : isOn
          ? ROBOOST_UI_THEME.accent
          : ROBOOST_UI_THEME.borderStrong};
  border-radius: ${ROBOOST_UI_THEME.radiusXs};
  box-sizing: border-box;
  color: ${ROBOOST_UI_THEME.textOnAccent};
  display: inline-flex;
  flex: none;
  height: 16px;
  justify-content: center;
  transition:
    background 0.1s,
    border-color 0.1s;
  width: 16px;
`;

const StyledDash = styled.span`
  background: ${ROBOOST_UI_THEME.textOnAccent};
  border-radius: 1px;
  height: 2px;
  width: 8px;
`;

export type CheckboxProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
  children?: ReactNode;
  'aria-label'?: string;
};

export const Checkbox = ({
  checked,
  defaultChecked = false,
  indeterminate = false,
  disabled = false,
  onChange,
  children,
  'aria-label': ariaLabel,
}: CheckboxProps) => {
  const [uncontrolledChecked, setUncontrolledChecked] =
    useState(defaultChecked);
  const isChecked = checked ?? uncontrolledChecked;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (checked === undefined) {
      setUncontrolledChecked(!isChecked);
    }
    onChange?.(!isChecked, event);
  };

  return (
    <StyledLabel
      isDisabled={disabled}
      onClick={(event) => event.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-checked={indeterminate ? 'mixed' : isChecked}
        onChange={handleChange}
      />
      <StyledBox isOn={isChecked || indeterminate} isDisabled={disabled}>
        {indeterminate ? (
          <StyledDash />
        ) : (
          isChecked && <Icon name="check" size={12} strokeWidth={3} />
        )}
      </StyledBox>
      {children}
    </StyledLabel>
  );
};
