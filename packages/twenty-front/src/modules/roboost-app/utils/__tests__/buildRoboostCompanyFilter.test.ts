import { EMPTY_ROBOOST_COMPANY_LIST_FILTERS } from '@/roboost-app/types/RoboostCompanyListFilters';
import { buildRoboostCompanyFilter } from '@/roboost-app/utils/buildRoboostCompanyFilter';

const NOW = new Date('2026-11-20T12:00:00.000Z');
const ALL_FIELDS = new Set([
  'name',
  'accountOwner',
  'lastActivityDate',
  'leadStatus',
  'createdAt',
]);

describe('buildRoboostCompanyFilter', () => {
  it('returns no filter when nothing is selected', () => {
    expect(
      buildRoboostCompanyFilter({
        viewFilter: undefined,
        search: '  ',
        filters: EMPTY_ROBOOST_COMPANY_LIST_FILTERS,
        currentWorkspaceMemberId: 'member-1',
        availableFieldNames: ALL_FIELDS,
        now: NOW,
      }),
    ).toBeUndefined();
  });

  it('combines the saved view, search and chips with and', () => {
    expect(
      buildRoboostCompanyFilter({
        viewFilter: { operatesIn: { in: ['SAUDI_ARABIA'] } },
        search: 'roman',
        filters: {
          ...EMPTY_ROBOOST_COMPANY_LIST_FILTERS,
          ownerId: 'me',
          createdWithin: 'last7',
          selectValuesByFieldName: { leadStatus: ['NEW', 'CUSTOMER'] },
        },
        currentWorkspaceMemberId: 'member-1',
        availableFieldNames: ALL_FIELDS,
        now: NOW,
      }),
    ).toEqual({
      and: [
        { operatesIn: { in: ['SAUDI_ARABIA'] } },
        { name: { ilike: '%roman%' } },
        { accountOwnerId: { eq: 'member-1' } },
        { createdAt: { gte: '2026-11-13T12:00:00.000Z' } },
        { leadStatus: { in: ['NEW', 'CUSTOMER'] } },
      ],
    });
  });

  it('skips chips whose field does not exist in the workspace', () => {
    expect(
      buildRoboostCompanyFilter({
        viewFilter: {},
        search: '',
        filters: {
          ...EMPTY_ROBOOST_COMPANY_LIST_FILTERS,
          ownerId: 'none',
          lastActivityWithin: 'last30',
          selectValuesByFieldName: { leadStatus: ['NEW'] },
        },
        currentWorkspaceMemberId: 'member-1',
        availableFieldNames: new Set(['name']),
        now: NOW,
      }),
    ).toBeUndefined();
  });
});
