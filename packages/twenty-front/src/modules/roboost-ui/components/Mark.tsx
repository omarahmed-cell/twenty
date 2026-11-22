import { RoboostMark } from '@/ui/brand/components/RoboostMark';
import { ROBOOST_LOGO_PATHS } from '@/roboost-ui/constants/RoboostLogoPaths';

export type MarkProps = { height?: number; variant?: 'color' | 'white' };

export const Mark = ({ height = 24, variant = 'color' }: MarkProps) =>
  variant === 'white' ? (
    <img
      src={ROBOOST_LOGO_PATHS.roboostMarkWhite}
      alt="Roboost"
      style={{ display: 'block', height, width: 'auto' }}
    />
  ) : (
    <RoboostMark height={height} />
  );
