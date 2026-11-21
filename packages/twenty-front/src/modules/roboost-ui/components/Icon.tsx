import { ROBOOST_FILLED_ICON_PATHS } from '@/roboost-ui/constants/RoboostFilledIconPaths';
import { ROBOOST_ICON_PATHS } from '@/roboost-ui/constants/RoboostIconPaths';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';

export type IconProps = {
  name: RoboostIconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export const Icon = ({
  name,
  size = 18,
  className,
  strokeWidth = 1.75,
}: IconProps) => {
  const style = { width: size, height: size };

  if (name === 'more' || name === 'more-vertical') {
    const isVertical = name === 'more-vertical';

    return (
      <svg
        className={cx('rb-icon', className)}
        style={{ ...style, fill: 'currentColor', stroke: 'none' }}
        viewBox="0 0 24 24"
        aria-hidden
      >
        {[5, 12, 19].map((position) => (
          <circle
            key={position}
            cx={isVertical ? 12 : position}
            cy={isVertical ? position : 12}
            r={1.6}
          />
        ))}
      </svg>
    );
  }

  if (name in ROBOOST_FILLED_ICON_PATHS) {
    return (
      <svg
        className={cx('rb-icon', className)}
        style={{ ...style, fill: 'currentColor', stroke: 'none' }}
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          d={
            ROBOOST_FILLED_ICON_PATHS[
              name as keyof typeof ROBOOST_FILLED_ICON_PATHS
            ]
          }
        />
      </svg>
    );
  }

  const paths: readonly string[] =
    ROBOOST_ICON_PATHS[name as keyof typeof ROBOOST_ICON_PATHS] ?? [];

  return (
    <svg
      className={cx('rb-icon', className)}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
};
