import { ROBOOST_FILLED_ICON_PATHS } from '@/roboost-ui/constants/RoboostFilledIconPaths';
import { ROBOOST_ICON_PATHS } from '@/roboost-ui/constants/RoboostIconPaths';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { styled } from '@linaria/react';

const StyledSvg = styled.svg<{ size: number }>`
  display: inline-block;
  flex: none;
  height: ${({ size }) => `${size}px`};
  vertical-align: middle;
  width: ${({ size }) => `${size}px`};
`;

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
  if (name === 'more') {
    return (
      <StyledSvg
        className={className}
        size={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        aria-hidden
      >
        <circle cx={5} cy={12} r={1.6} />
        <circle cx={12} cy={12} r={1.6} />
        <circle cx={19} cy={12} r={1.6} />
      </StyledSvg>
    );
  }

  if (name in ROBOOST_FILLED_ICON_PATHS) {
    return (
      <StyledSvg
        className={className}
        size={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        aria-hidden
      >
        <path
          d={
            ROBOOST_FILLED_ICON_PATHS[
              name as keyof typeof ROBOOST_FILLED_ICON_PATHS
            ]
          }
        />
      </StyledSvg>
    );
  }

  const paths: readonly string[] =
    ROBOOST_ICON_PATHS[name as keyof typeof ROBOOST_ICON_PATHS] ?? [];

  return (
    <StyledSvg
      className={className}
      size={size}
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
    </StyledSvg>
  );
};
