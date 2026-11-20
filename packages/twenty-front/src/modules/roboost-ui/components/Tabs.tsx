import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { styled } from '@linaria/react';
import { type ReactNode, useState } from 'react';

const StyledTabs = styled.div<{ hasBorder: boolean }>`
  border-bottom: ${({ hasBorder }) =>
    hasBorder ? `1px solid ${ROBOOST_UI_THEME.border}` : 'none'};
  min-width: 0;
`;

const StyledTabList = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scrollbar-width: none;
`;

const StyledTab = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: ${ROBOOST_UI_THEME.textSecondary};
  cursor: pointer;
  display: inline-flex;
  flex: none;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 13px;
  font-weight: 500;
  gap: 8px;
  line-height: 16px;
  padding: 8px 2px 12px;
  position: relative;
  white-space: nowrap;

  &::after {
    background: transparent;
    border-radius: 2px 2px 0 0;
    bottom: 0;
    content: '';
    height: 2px;
    left: 0;
    position: absolute;
    right: 0;
  }

  &:hover {
    color: ${ROBOOST_UI_THEME.text};
  }

  &[aria-selected='true'] {
    color: ${ROBOOST_UI_THEME.accentText};
  }

  &[aria-selected='true']::after {
    background: ${ROBOOST_UI_THEME.accent};
  }

  &:focus-visible {
    border-radius: ${ROBOOST_UI_THEME.radiusXs};
    box-shadow: ${ROBOOST_UI_THEME.shadowFocus};
    outline: none;
  }
`;

const StyledCount = styled.span<{ isActive: boolean }>`
  align-items: center;
  background: ${({ isActive }) =>
    isActive ? ROBOOST_UI_THEME.accentSoft : ROBOOST_UI_THEME.surfaceSunken};
  border-radius: 999px;
  color: ${({ isActive }) =>
    isActive ? ROBOOST_UI_THEME.accentText : ROBOOST_UI_THEME.textMuted};
  display: inline-flex;
  font-size: 11px;
  font-weight: 600;
  height: 18px;
  justify-content: center;
  min-width: 18px;
  padding: 0 5px;
`;

export type TabItem = {
  id: string;
  label: ReactNode;
  count?: number;
  icon?: RoboostIconName;
};

export type TabsProps = {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  className?: string;
  hasBorder?: boolean;
};

export const Tabs = ({
  tabs,
  value,
  defaultValue,
  onChange,
  className,
  hasBorder = true,
}: TabsProps) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue ?? tabs[0]?.id,
  );
  const activeId = value ?? uncontrolledValue;

  const pick = (id: string) => {
    if (value === undefined) {
      setUncontrolledValue(id);
    }
    onChange?.(id);
  };

  return (
    <StyledTabs className={className} hasBorder={hasBorder}>
      <StyledTabList role="tablist">
        {tabs.map((tab) => (
          <StyledTab
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            onClick={() => pick(tab.id)}
          >
            {tab.icon !== undefined && <Icon name={tab.icon} size={16} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <StyledCount isActive={tab.id === activeId}>
                {tab.count}
              </StyledCount>
            )}
          </StyledTab>
        ))}
      </StyledTabList>
    </StyledTabs>
  );
};
