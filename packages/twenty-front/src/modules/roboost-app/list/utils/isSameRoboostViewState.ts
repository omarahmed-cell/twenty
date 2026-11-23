import { type RoboostSavedViewState } from '@/roboost-app/list/hooks/useRoboostSavedViewState';

const sortKeys = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(sortKeys)
    : typeof value === 'object' && value !== null
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [
              key,
              sortKeys((value as Record<string, unknown>)[key]),
            ]),
        )
      : value;

export const isSameRoboostViewState = (
  first: RoboostSavedViewState,
  second: RoboostSavedViewState,
) => JSON.stringify(sortKeys(first)) === JSON.stringify(sortKeys(second));
