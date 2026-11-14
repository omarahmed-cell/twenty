import { getCompanyParentChildUpdate } from '@/page-layout/widgets/field/utils/getCompanyParentChildUpdate';

const holding = { id: 'holding-id', name: 'Holding' };
const otherHolding = { id: 'other-holding-id', name: 'Other Holding' };

describe('getCompanyParentChildUpdate', () => {
  it('should give the picked company the current company as parent when picked as child', () => {
    const currentCompany = { id: 'current-id', name: 'Current' };
    const pickedCompany = {
      id: 'picked-id',
      name: 'Picked',
      parentCompany: null,
    };

    expect(
      getCompanyParentChildUpdate({
        currentCompany,
        pickedCompany,
        label: 'child',
      }),
    ).toEqual({
      companyToUpdate: pickedCompany,
      newParentCompanyId: 'current-id',
      replacedParentCompany: null,
    });
  });

  it('should give the current company the picked company as parent when picked as parent', () => {
    const currentCompany = {
      id: 'current-id',
      name: 'Current',
      parentCompany: null,
    };
    const pickedCompany = { id: 'picked-id', name: 'Picked' };

    expect(
      getCompanyParentChildUpdate({
        currentCompany,
        pickedCompany,
        label: 'parent',
      }),
    ).toEqual({
      companyToUpdate: currentCompany,
      newParentCompanyId: 'picked-id',
      replacedParentCompany: null,
    });
  });

  it('should report the parent being replaced when the picked child already has another parent', () => {
    const pickedCompany = {
      id: 'picked-id',
      name: 'Picked',
      parentCompany: otherHolding,
    };

    expect(
      getCompanyParentChildUpdate({
        currentCompany: { id: 'current-id', name: 'Current' },
        pickedCompany,
        label: 'child',
      }).replacedParentCompany,
    ).toEqual(otherHolding);
  });

  it('should report the parent being replaced when the current company already has another parent', () => {
    expect(
      getCompanyParentChildUpdate({
        currentCompany: {
          id: 'current-id',
          name: 'Current',
          parentCompany: otherHolding,
        },
        pickedCompany: holding,
        label: 'parent',
      }).replacedParentCompany,
    ).toEqual(otherHolding);
  });

  it('should not ask to replace a parent that stays the same', () => {
    expect(
      getCompanyParentChildUpdate({
        currentCompany: {
          id: 'current-id',
          name: 'Current',
          parentCompany: holding,
        },
        pickedCompany: holding,
        label: 'parent',
      }).replacedParentCompany,
    ).toBeNull();
  });
});
