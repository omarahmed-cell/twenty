import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type CSSProperties, type FocusEvent, useState } from 'react';

const StyledSelect = styled.div`
  display: inline-block;
  position: relative;
`;

const StyledTrigger = styled.button<{ isPlaceholder: boolean }>`
  align-items: center;
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.borderStrong};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  box-sizing: border-box;
  color: ${({ isPlaceholder }) =>
    isPlaceholder ? ROBOOST_UI_THEME.textMuted : ROBOOST_UI_THEME.text};
  cursor: pointer;
  display: inline-flex;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 14px;
  gap: 8px;
  height: 32px;
  justify-content: space-between;
  min-width: 160px;
  padding: 0 8px 0 12px;
  text-align: left;
  width: 100%;

  &:hover {
    border-color: ${ROBOOST_UI_THEME.controlHoverBorder};
  }

  &[aria-expanded='true'] {
    border-color: ${ROBOOST_UI_THEME.accent};
    box-shadow: ${ROBOOST_UI_THEME.shadowFocus};
  }

  &[aria-expanded='true'] > svg {
    transform: rotate(180deg);
  }

  > svg {
    color: ${ROBOOST_UI_THEME.textMuted};
    transition: transform 0.12s;
  }
`;

const StyledMenu = styled.div`
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.border};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  box-shadow: ${ROBOOST_UI_THEME.shadowMd};
  box-sizing: border-box;
  left: 0;
  max-height: 260px;
  min-width: 100%;
  overflow: auto;
  padding: 4px;
  position: absolute;
  top: calc(100% + 4px);
  z-index: 20;
`;

const StyledMenuItem = styled.div`
  align-items: center;
  border-radius: ${ROBOOST_UI_THEME.radiusXs};
  color: ${ROBOOST_UI_THEME.text};
  cursor: pointer;
  display: flex;
  font-size: 14px;
  gap: 8px;
  justify-content: space-between;
  padding: 8px 8px 8px 12px;
  white-space: nowrap;

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
  }

  &[aria-selected='true'] {
    color: ${ROBOOST_UI_THEME.accentText};
    font-weight: 500;
  }

  &[aria-selected='true'] > svg {
    color: ${ROBOOST_UI_THEME.accent};
  }
`;

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  defaultOpen?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  style?: CSSProperties;
};

export const Select = ({
  options,
  value,
  defaultValue,
  placeholder,
  defaultOpen = false,
  onChange,
  className,
  style,
}: SelectProps) => {
  const { t } = useLingui();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const currentValue = value ?? uncontrolledValue;
  const currentOption = options.find((option) => option.value === currentValue);

  const choose = (option: SelectOption) => {
    if (value === undefined) {
      setUncontrolledValue(option.value);
    }
    setIsOpen(false);
    onChange?.(option.value);
  };

  const closeWhenFocusLeaves = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  };

  return (
    <StyledSelect
      className={className}
      style={style}
      onBlur={closeWhenFocusLeaves}
    >
      <StyledTrigger
        type="button"
        isPlaceholder={currentOption === undefined}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentOption?.label ?? placeholder ?? t`Select`}</span>
        <Icon name="caret" size={18} />
      </StyledTrigger>
      {isOpen && (
        <StyledMenu role="listbox" tabIndex={-1}>
          {options.map((option) => (
            <StyledMenuItem
              key={option.value}
              role="option"
              aria-selected={option.value === currentValue}
              onClick={() => choose(option)}
            >
              <span>{option.label}</span>
              {option.value === currentValue && <Icon name="check" size={16} />}
            </StyledMenuItem>
          ))}
        </StyledMenu>
      )}
    </StyledSelect>
  );
};
