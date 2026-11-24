import { buildRoboostAssignListPath } from 'src/modules/roboost-notification/utils/build-roboost-assign-list-path.util';

describe('buildRoboostAssignListPath', () => {
  it('filters on this month and the recipient, limited to the batch', () => {
    const path = buildRoboostAssignListPath({
      objectNamePlural: 'people',
      ownerFieldName: 'contactSdrOwner',
      assignedDateFieldName: 'sdrOwnerAssignedDate',
      recipientWorkspaceMemberId: 'member-1',
      recipientName: 'Naira Mohamed',
      recordIds: ['a', 'b'],
    });
    const url = new URL(path, 'https://crm.test');
    const filters = JSON.parse(url.searchParams.get('rbFilters') ?? '{}');

    expect(url.pathname).toBe('/objects/people');
    expect(url.searchParams.get('filterIds')).toBe('a,b');
    expect(filters.groups[0].rules).toEqual([
      expect.objectContaining({
        fieldName: 'sdrOwnerAssignedDate',
        operator: 'isThisMonth',
      }),
      expect.objectContaining({
        fieldName: 'contactSdrOwner',
        operator: 'isAnyOf',
        value: ['member-1'],
      }),
    ]);
  });

  it('drops the date rule when the field has no stamped date', () => {
    const path = buildRoboostAssignListPath({
      objectNamePlural: 'companies',
      ownerFieldName: 'customerSuccessResponsible',
      assignedDateFieldName: null,
      recipientWorkspaceMemberId: 'member-1',
      recipientName: 'Naira',
      recordIds: Array.from({ length: 400 }, (_, index) => `id-${index}`),
    });
    const url = new URL(path, 'https://crm.test');

    expect(url.searchParams.get('filterIds')).toBeNull();
    expect(
      JSON.parse(url.searchParams.get('rbFilters') ?? '{}').groups[0].rules,
    ).toHaveLength(1);
  });
});
