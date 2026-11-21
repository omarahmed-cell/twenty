import { RoboostWordmark } from '@/ui/brand/components/RoboostWordmark';
import { ROBOOST_MARK_POLYGONS } from '@/ui/brand/constants/RoboostMarkPolygons';
import { themeCssVariables } from 'twenty-ui/theme';

export type WordmarkProps = { height?: number; variant?: 'color' | 'white' };

// The hand-off's logo files are JPEGs without transparency, so the frame draws the vector lockup instead
export const Wordmark = ({ height = 22, variant = 'color' }: WordmarkProps) =>
  variant === 'white' ? (
    <svg
      viewBox="0 0 3056 534"
      height={height}
      role="img"
      aria-label="Roboost"
      fill="currentColor"
    >
      {ROBOOST_MARK_POLYGONS.map((points) => (
        <polygon key={points} points={points} />
      ))}
      <text
        x={1232}
        y={391}
        fontFamily={themeCssVariables.font.familyDisplay}
        fontWeight={700}
        fontSize={251}
        letterSpacing={-4}
      >
        ROBOOST
      </text>
    </svg>
  ) : (
    <RoboostWordmark height={height} />
  );
