export const isSameUtcDay = (first: Date, second: Date) =>
  first.toISOString().slice(0, 10) === second.toISOString().slice(0, 10);
