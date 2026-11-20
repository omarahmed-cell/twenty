import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostAvatarTone } from '@/roboost-ui/types/RoboostAvatarTone';
import { getInitials } from '@/roboost-ui/utils/getInitials';
import { styled } from '@linaria/react';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const DIMENSIONS_BY_SIZE: Record<AvatarSize, { box: string; font: string }> = {
  xs: { box: '22px', font: '10px' },
  sm: { box: '26px', font: '11px' },
  md: { box: '32px', font: '12px' },
  lg: { box: '40px', font: '14px' },
};

const BACKGROUND_BY_TONE: Record<RoboostAvatarTone | 'neutral', string> = {
  neutral: ROBOOST_UI_THEME.avatarBackground,
  accent: ROBOOST_UI_THEME.accentSoft,
  success: ROBOOST_UI_THEME.successSoft,
  info: ROBOOST_UI_THEME.infoSoft,
};

const COLOR_BY_TONE: Record<RoboostAvatarTone | 'neutral', string> = {
  neutral: ROBOOST_UI_THEME.avatarForeground,
  accent: ROBOOST_UI_THEME.accentText,
  success: ROBOOST_UI_THEME.successText,
  info: ROBOOST_UI_THEME.infoText,
};

const STATUS_COLOR: Record<'online' | 'away' | 'offline', string> = {
  online: ROBOOST_UI_THEME.success,
  away: ROBOOST_UI_THEME.warning,
  offline: ROBOOST_UI_THEME.textDisabled,
};

const StyledAvatar = styled.span<{
  size: AvatarSize;
  tone: RoboostAvatarTone | 'neutral';
}>`
  align-items: center;
  background: ${({ tone }) => BACKGROUND_BY_TONE[tone]};
  border-radius: ${ROBOOST_UI_THEME.radiusFull};
  color: ${({ tone }) => COLOR_BY_TONE[tone]};
  display: inline-flex;
  flex: none;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: ${({ size }) => DIMENSIONS_BY_SIZE[size].font};
  font-weight: 600;
  height: ${({ size }) => DIMENSIONS_BY_SIZE[size].box};
  justify-content: center;
  position: relative;
  text-transform: uppercase;
  width: ${({ size }) => DIMENSIONS_BY_SIZE[size].box};

  img {
    border-radius: inherit;
    height: 100%;
    object-fit: cover;
    width: 100%;
  }
`;

const StyledStatus = styled.span<{ status: 'online' | 'away' | 'offline' }>`
  background: ${({ status }) => STATUS_COLOR[status]};
  border: 2px solid ${ROBOOST_UI_THEME.surface};
  border-radius: 999px;
  bottom: -1px;
  height: 9px;
  position: absolute;
  right: -1px;
  width: 9px;
`;

export type AvatarProps = {
  name?: string;
  src?: string | null;
  size?: AvatarSize;
  tone?: RoboostAvatarTone;
  status?: 'online' | 'away' | 'offline';
  className?: string;
};

export const Avatar = ({
  name,
  src,
  size = 'md',
  tone,
  status,
  className,
}: AvatarProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const isImageShown = isNonEmptyString(src) && src !== failedSrc;

  return (
    <StyledAvatar
      size={size}
      tone={tone ?? 'neutral'}
      className={className}
      title={name}
      aria-label={name}
    >
      {isImageShown ? (
        <img src={src} alt={name ?? ''} onError={() => setFailedSrc(src)} />
      ) : isNonEmptyString(name) ? (
        getInitials(name)
      ) : (
        <Icon name="contacts" size={16} />
      )}
      {status !== undefined && <StyledStatus status={status} />}
    </StyledAvatar>
  );
};
