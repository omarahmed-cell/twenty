import {
  buildRoboostFilterRule,
  ROBOOST_FILTER_BLANK_VALUE,
} from '@/utils/roboost-filter/buildRoboostFilterRule';

type BuildInput = Parameters<typeof buildRoboostFilterRule>[0];

describe('buildRoboostFilterRule Blank value', () => {
  it('matches empty or the picked options for a select', () => {
    expect(
      buildRoboostFilterRule({
        field: { name: 'leadStatus', type: 'SELECT' },
        operator: 'isAnyOf',
        value: [ROBOOST_FILTER_BLANK_VALUE, 'NEW'],
      } as BuildInput),
    ).toEqual({
      or: [{ leadStatus: { is: 'NULL' } }, { leadStatus: { in: ['NEW'] } }],
    });
  });

  it('matches only empty values when Blank is the only pick', () => {
    expect(
      buildRoboostFilterRule({
        field: { name: 'leadStatus', type: 'SELECT' },
        operator: 'isAnyOf',
        value: [ROBOOST_FILTER_BLANK_VALUE],
      } as BuildInput),
    ).toEqual({ leadStatus: { is: 'NULL' } });
  });

  it('excludes empty values for none of Blank', () => {
    expect(
      buildRoboostFilterRule({
        field: { name: 'leadStatus', type: 'SELECT' },
        operator: 'isNoneOf',
        value: [ROBOOST_FILTER_BLANK_VALUE],
      } as BuildInput),
    ).toEqual({ leadStatus: { is: 'NOT_NULL' } });
  });

  it('matches an unassigned owner or the picked member for a relation', () => {
    expect(
      buildRoboostFilterRule({
        field: {
          name: 'accountOwner',
          type: 'RELATION',
          relation: { type: 'MANY_TO_ONE' },
        },
        operator: 'isAnyOf',
        value: [ROBOOST_FILTER_BLANK_VALUE, 'member-1'],
      } as BuildInput),
    ).toEqual({
      or: [
        { accountOwnerId: { is: 'NULL' } },
        { accountOwnerId: { in: ['member-1'] } },
      ],
    });
  });

  it('matches empty multi-selects or ones containing a picked option', () => {
    expect(
      buildRoboostFilterRule({
        field: { name: 'products', type: 'MULTI_SELECT' },
        operator: 'isAnyOf',
        value: [ROBOOST_FILTER_BLANK_VALUE, 'DMS'],
      } as BuildInput),
    ).toEqual({
      or: [
        {
          or: [
            { products: { is: 'NULL' } },
            { products: { isEmptyArray: true } },
          ],
        },
        { products: { containsAny: ['DMS'] } },
      ],
    });
  });
});
