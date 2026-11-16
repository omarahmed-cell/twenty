import { moveArrayItem } from '~/utils/array/moveArrayItem';

type PositionedItem = { id: string; position: number };

// Positions become the new indexes; only the items whose position actually changes are returned
export const computeReorderedPositions = <TItem extends PositionedItem>({
  items,
  fromIndex,
  toIndex,
}: {
  items: TItem[];
  fromIndex: number;
  toIndex: number;
}): PositionedItem[] =>
  moveArrayItem(items, { fromIndex, toIndex })
    .map((item, index) => ({ id: item.id, position: index }))
    .filter(
      ({ id, position }) =>
        items.find((item) => item.id === id)?.position !== position,
    );
