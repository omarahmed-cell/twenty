import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_TONE_COLORS } from '@/roboost-ui/constants/RoboostToneColors';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { type RoboostTone } from '@/roboost-ui/types/RoboostTone';
import { styled } from '@linaria/react';
import { type ReactNode } from 'react';

const StyledCard = styled.div`
  align-items: flex-start;
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.border};
  border-radius: ${ROBOOST_UI_THEME.radiusMd};
  box-shadow: ${ROBOOST_UI_THEME.shadowXs};
  display: flex;
  gap: 12px;
  padding: 12px 14px;

  &[role='button'] {
    cursor: pointer;
  }

  &[role='button']:hover {
    border-color: ${ROBOOST_UI_THEME.borderStrong};
  }
`;

const StyledIcon = styled.span<{ tone: RoboostTone }>`
  align-items: center;
  background: ${({ tone }) =>
    tone === 'neutral'
      ? ROBOOST_UI_THEME.surfaceSunken
      : ROBOOST_TONE_COLORS[tone].background};
  border-radius: 999px;
  color: ${({ tone }) =>
    tone === 'neutral'
      ? ROBOOST_UI_THEME.textSecondary
      : ROBOOST_TONE_COLORS[tone].color};
  display: flex;
  flex: none;
  height: 30px;
  justify-content: center;
  width: 30px;
`;

const StyledMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledTitle = styled.div`
  color: ${ROBOOST_UI_THEME.text};
  font-size: 13px;
  line-height: 18px;

  b {
    font-weight: 600;
  }
`;

const StyledDescription = styled.div`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: ${ROBOOST_UI_THEME.textSecondary};
  display: -webkit-box;
  font-size: 13px;
  line-height: 18px;
  margin-top: 3px;
  overflow: hidden;
`;

const StyledTime = styled.span`
  color: ${ROBOOST_UI_THEME.textMuted};
  flex: none;
  font-size: 12px;
  line-height: 16px;
  padding-top: 1px;
  white-space: nowrap;
`;

export type RoboostActivityCardProps = {
  icon: RoboostIconName;
  tone: RoboostTone;
  title: ReactNode;
  time: ReactNode;
  description?: ReactNode;
  onOpen?: () => void;
};

export const RoboostActivityCard = ({
  icon,
  tone,
  title,
  time,
  description,
  onOpen,
}: RoboostActivityCardProps) => (
  <StyledCard
    role={onOpen !== undefined ? 'button' : undefined}
    tabIndex={onOpen !== undefined ? 0 : undefined}
    onClick={onOpen}
    onKeyDown={(event) => {
      if (
        onOpen !== undefined &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault();
        onOpen();
      }
    }}
  >
    <StyledIcon tone={tone}>
      <Icon name={icon} size={16} />
    </StyledIcon>
    <StyledMain>
      <StyledTitle>{title}</StyledTitle>
      {description !== undefined && (
        <StyledDescription>{description}</StyledDescription>
      )}
    </StyledMain>
    <StyledTime>{time}</StyledTime>
  </StyledCard>
);
