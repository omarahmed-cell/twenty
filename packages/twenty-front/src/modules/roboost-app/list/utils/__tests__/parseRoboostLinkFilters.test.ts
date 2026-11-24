import { parseRoboostLinkFilters } from '@/roboost-app/list/utils/parseRoboostLinkFilters';

describe('parseRoboostLinkFilters', () => {
  it('reads the advanced filters and the exact record ids', () => {
    const searchParams = new URLSearchParams({
      rbFilters: JSON.stringify({
        groups: [
          {
            id: 'g',
            rules: [
              {
                id: 'r',
                fieldName: 'ownerAssignedDate',
                operator: 'isThisMonth',
                value: null,
              },
            ],
          },
        ],
        associations: [],
      }),
      filterIds: 'a,b',
    });
    const { advanced, idsFilter } = parseRoboostLinkFilters(searchParams);

    expect(advanced?.groups[0].rules[0].operator).toBe('isThisMonth');
    expect(idsFilter).toEqual({ id: { in: ['a', 'b'] } });
  });

  it('ignores a broken link instead of failing the page', () => {
    const { advanced, idsFilter } = parseRoboostLinkFilters(
      new URLSearchParams({ rbFilters: '{not json' }),
    );

    expect(advanced).toBeNull();
    expect(idsFilter).toBeNull();
  });
});
