import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_TONE_COLORS } from '@/roboost-ui/constants/RoboostToneColors';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { styled } from '@linaria/react';
import { type ReactNode } from 'react';

type TimelineItemTone = 'neutral' | 'accent' | 'success' | 'warning';

const StyledItem = styled.div`
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
  position: relative;

  &:last-child .roboost-timeline-line {
    display: none;
  }
`;

const StyledRail = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  flex-direction: column;
  position: relative;
  width: 28px;
`;

const StyledNode = styled.span<{ tone: TimelineItemTone }>`
  align-items: center;
  background: ${({ tone }) => ROBOOST_TONE_COLORS[tone].background};
  border: 1px solid ${({ tone }) => ROBOOST_TONE_COLORS[tone].border};
  border-radius: 999px;
  color: ${({ tone }) => ROBOOST_TONE_COLORS[tone].color};
  display: inline-flex;
  height: 28px;
  justify-content: center;
  width: 28px;
  z-index: 1;
`;

const StyledLine = styled.span`
  background: ${ROBOOST_UI_THEME.border};
  bottom: -4px;
  position: absolute;
  top: 28px;
  width: 2px;
`;

const StyledBody = styled.div`
  flex: 1;
  min-width: 0;
  padding-top: 3px;
`;

const StyledTitle = styled.div`
  color: ${ROBOOST_UI_THEME.text};
  font-size: 13px;

  b {
    font-weight: 600;
  }
`;

const StyledTime = styled.div`
  color: ${ROBOOST_UI_THEME.textMuted};
  font-size: 12px;
  margin-top: 1px;
`;

const StyledNote = styled.div`
  background: ${ROBOOST_UI_THEME.surfaceSunken};
  border: 1px solid ${ROBOOST_UI_THEME.borderSubtle};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: ${ROBOOST_UI_THEME.textSecondary};
  font-size: 13px;
  margin-top: 8px;
  padding: 8px 12px;
`;

export type TimelineItemProps = {
  icon?: RoboostIconName;
  tone?: 'accent' | 'success' | 'warning';
  title: ReactNode;
  time?: ReactNode;
  children?: ReactNode;
};

export const TimelineItem = ({
  icon = 'dot',
  tone,
  title,
  time,
  children,
}: TimelineItemProps) => (
  <StyledItem>
    <StyledRail>
      <StyledNode tone={tone ?? 'neutral'}>
        <Icon name={icon} size={15} />
      </StyledNode>
      <StyledLine className="roboost-timeline-line" />
    </StyledRail>
    <StyledBody>
      <StyledTitle>{title}</StyledTitle>
      {time !== undefined && <StyledTime>{time}</StyledTime>}
      {children !== undefined && <StyledNote>{children}</StyledNote>}
    </StyledBody>
  </StyledItem>
);
