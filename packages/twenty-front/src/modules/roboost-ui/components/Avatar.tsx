import { Icon } from '@/roboost-ui/components/Icon';
import { type RoboostAvatarTone } from '@/roboost-ui/types/RoboostAvatarTone';
import { cx } from '@/roboost-ui/utils/cx';
import { getInitials } from '@/roboost-ui/utils/getInitials';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';

export type AvatarProps = {
  name?: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
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
    <span
      className={cx(
        'rb-avatar',
        `rb-avatar-${size}`,
        tone !== undefined && `rb-avatar-${tone}`,
        className,
      )}
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
      {status !== undefined && (
        <span className={cx('rb-avatar-status', `is-${status}`)} />
      )}
    </span>
  );
};
