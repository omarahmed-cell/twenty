import { useId } from 'react';
import { themeCssVariables } from 'twenty-ui/theme';

import { ROBOOST_GRADIENT_STOPS } from '@/ui/brand/constants/RoboostGradientStops';
import { ROBOOST_MARK_POLYGONS } from '@/ui/brand/constants/RoboostMarkPolygons';

type RoboostWordmarkProps = {
  height?: number;
};

export const RoboostWordmark = ({ height = 22 }: RoboostWordmarkProps) => {
  const gradientId = `roboost-wordmark-${useId()}`;

  return (
    <svg viewBox="0 0 3056 534" height={height} role="img" aria-label="Roboost">
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
      <text
        x={1232}
        y={391}
        fontFamily={themeCssVariables.font.familyDisplay}
        fontWeight={700}
        fontSize={251}
        fill={themeCssVariables.brand.red}
        letterSpacing={-4}
      >
        ROBOOST
      </text>
    </svg>
  );
};
