import { type View } from '@/views/types/View';
import { ViewKey } from '@/views/types/ViewKey';

// Saved order first; views missing from it (new ones) follow, with the "All" view leading by default
export const orderRoboostViews = (
  views: View[],
  savedOrder: string[] | undefined,
): View[] => {
  const byDefault = [...views].sort((first, second) => {
    if (first.key === ViewKey.INDEX) {
      return -1;
    }
    if (second.key === ViewKey.INDEX) {
      return 1;
    }

    return first.position - second.position;
  });

  if (savedOrder === undefined || savedOrder.length === 0) {
    return byDefault;
  }
  const rank = new Map(savedOrder.map((id, index) => [id, index]));

  return [...byDefault].sort(
    (first, second) =>
      (rank.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(second.id) ?? Number.MAX_SAFE_INTEGER),
  );
};
