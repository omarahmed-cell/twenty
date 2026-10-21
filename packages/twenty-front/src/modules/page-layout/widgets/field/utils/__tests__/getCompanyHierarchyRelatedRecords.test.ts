import { getCompanyHierarchyRelatedRecords } from '@/page-layout/widgets/field/utils/getCompanyHierarchyRelatedRecords';

const parent = { id: 'parent-id', __typename: 'Company', name: 'Holding' };
const firstChild = { id: 'child-1', __typename: 'Company', name: 'Sub A' };
const secondChild = { id: 'child-2', __typename: 'Company', name: 'Sub B' };

describe('getCompanyHierarchyRelatedRecords', () => {
  it('should list the parent first, then the children', () => {
    expect(
      getCompanyHierarchyRelatedRecords({
        parentCompany: parent,
        childCompanies: [firstChild, secondChild],
      }),
    ).toEqual([
      { record: parent, hierarchyRole: 'parent' },
      { record: firstChild, hierarchyRole: 'child' },
      { record: secondChild, hierarchyRole: 'child' },
    ]);
  });

  it('should return only the parent when there are no children', () => {
    expect(
      getCompanyHierarchyRelatedRecords({
        parentCompany: parent,
        childCompanies: [],
      }),
    ).toEqual([{ record: parent, hierarchyRole: 'parent' }]);
  });

  it('should return only children when there is no parent', () => {
    expect(
      getCompanyHierarchyRelatedRecords({
        parentCompany: null,
        childCompanies: [firstChild],
      }),
    ).toEqual([{ record: firstChild, hierarchyRole: 'child' }]);
  });

  it('should return an empty list when relations are not loaded', () => {
    expect(
      getCompanyHierarchyRelatedRecords({
        parentCompany: undefined,
        childCompanies: undefined,
      }),
    ).toEqual([]);
  });
});
