// Moves the dragged item onto the target's slot, before it when moving up and after it when moving down
export const moveRoboostLayoutItem = <TItem>(
  items: TItem[],
  getId: (item: TItem) => string,
  draggedId: string,
  targetId: string,
): TItem[] => {
  const fromIndex = items.findIndex((item) => getId(item) === draggedId);
  const toIndex = items.findIndex((item) => getId(item) === targetId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items;
  }
  const next = [...items];
  const [dragged] = next.splice(fromIndex, 1);

  next.splice(toIndex, 0, dragged);

  return next;
};
