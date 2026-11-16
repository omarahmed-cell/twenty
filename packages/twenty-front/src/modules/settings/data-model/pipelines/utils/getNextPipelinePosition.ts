export const getNextPipelinePosition = (items: { position: number }[]) =>
  items.length === 0
    ? 0
    : Math.max(...items.map(({ position }) => position)) + 1;
