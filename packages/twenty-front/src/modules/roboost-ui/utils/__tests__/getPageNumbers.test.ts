import { getPageNumbers } from '@/roboost-ui/utils/getPageNumbers';

describe('getPageNumbers', () => {
  it('lists every page when there are few', () => {
    expect(getPageNumbers(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps the first and last page with gaps around the current one', () => {
    expect(getPageNumbers(1, 743)).toEqual([1, 2, 'gap-after', 743]);
    expect(getPageNumbers(50, 743)).toEqual([
      1,
      'gap-before',
      49,
      50,
      51,
      'gap-after',
      743,
    ]);
    expect(getPageNumbers(743, 743)).toEqual([1, 'gap-before', 742, 743]);
  });
});
