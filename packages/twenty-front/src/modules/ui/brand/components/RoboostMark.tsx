import { useId } from 'react';

import { ROBOOST_GRADIENT_STOPS } from '@/ui/brand/constants/RoboostGradientStops';
import { ROBOOST_MARK_POLYGONS } from '@/ui/brand/constants/RoboostMarkPolygons';

type RoboostMarkProps = {
  height?: number;
};

export const RoboostMark = ({ height = 24 }: RoboostMarkProps) => {
  const gradientId = `roboost-mark-${useId()}`;

  return (
    <svg viewBox="0 0 1003 534" height={height} role="img" aria-label="Roboost">
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={1003}
          y1={1}
          x2={1}
          y2={533}
        >
          {ROBOOST_GRADIENT_STOPS.map(({ offset, color }) => (
            <stop key={offset} offset={offset} stopColor={color} />
          ))}
        </linearGradient>
      </defs>
      {ROBOOST_MARK_POLYGONS.map((points) => (
        <polygon key={points} fill={`url(#${gradientId})`} points={points} />
      ))}
    </svg>
  );
};
