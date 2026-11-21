import { Icon } from '@/roboost-ui/components/Icon';
import { type RoboostTone } from '@/roboost-ui/types/RoboostTone';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';

export type TagProps = {
  tone?: RoboostTone;
  dot?: boolean;
  solid?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  children?: ReactNode;
  className?: string;
};

export const Tag = ({
  tone = 'neutral',
  dot = false,
  solid = false,
  removable = false,
  onRemove,
  children,
  className,
}: TagProps) => {
  const { t } = useLingui();

  return (
    <span
      className={cx(
        'rb-tag',
        `rb-tag-${tone}`,
        solid && 'rb-tag-solid',
        className,
      )}
    >
      {dot && <span className="rb-tag-dot" />}
      <span className="rb-truncate">{children}</span>
      {removable && (
        <span
          className="rb-tag-x"
          role="button"
          aria-label={t`Remove`}
          onClick={onRemove}
        >
          <Icon name="x" size={12} strokeWidth={2.5} />
        </span>
      )}
    </span>
  );
};
