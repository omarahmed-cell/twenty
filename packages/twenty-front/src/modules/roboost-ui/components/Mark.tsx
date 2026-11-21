import { ROBOOST_MARK_POLYGONS } from '@/ui/brand/constants/RoboostMarkPolygons';
import { RoboostMark } from '@/ui/brand/components/RoboostMark';

export type MarkProps = { height?: number; variant?: 'color' | 'white' };

export const Mark = ({ height = 24, variant = 'color' }: MarkProps) =>
  variant === 'white' ? (
    <svg
      viewBox="0 0 1003 534"
      height={height}
      role="img"
      aria-label="Roboost"
      fill="currentColor"
    >
      {ROBOOST_MARK_POLYGONS.map((points) => (
        <polygon key={points} points={points} />
      ))}
    </svg>
  ) : (
    <RoboostMark height={height} />
  );
