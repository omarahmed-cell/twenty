export type PageNumberItem = number | 'gap-before' | 'gap-after';

export const getPageNumbers = (
  current: number,
  pages: number,
): PageNumberItem[] => {
  if (pages <= 7) {
    return Array.from({ length: pages }, (_, index) => index + 1);
  }

  const items: PageNumberItem[] = [1];

  if (current > 3) {
    items.push('gap-before');
  }

  for (
    let page = Math.max(2, current - 1);
    page <= Math.min(pages - 1, current + 1);
    page++
  ) {
    items.push(page);
  }

  if (current < pages - 2) {
    items.push('gap-after');
  }

  items.push(pages);

  return items;
};
