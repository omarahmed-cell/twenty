import { ROBOOST_LOGO_PATHS } from '@/roboost-ui/constants/RoboostLogoPaths';

export type WordmarkProps = { height?: number; variant?: 'color' | 'white' };

export const Wordmark = ({ height = 22, variant = 'color' }: WordmarkProps) => (
  <img
    src={
      variant === 'white'
        ? ROBOOST_LOGO_PATHS.roboostWhite
        : ROBOOST_LOGO_PATHS.roboostColor
    }
    height={height}
    alt="Roboost"
    style={{ display: 'block', height, width: 'auto' }}
  />
);
