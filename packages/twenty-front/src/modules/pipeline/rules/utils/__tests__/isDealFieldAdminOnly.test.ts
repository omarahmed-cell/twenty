import { getDealAdminOnlyFieldNamesForViewer } from '@/pipeline/rules/utils/isDealFieldAdminOnly';

describe('getDealAdminOnlyFieldNamesForViewer', () => {
  it('makes Close Date read-only on deals for non-Admins only', () => {
    expect(
      getDealAdminOnlyFieldNamesForViewer({
        objectNameSingular: 'opportunity',
        isAdmin: false,
      }),
    ).toEqual(['closeDate']);
    expect(
      getDealAdminOnlyFieldNamesForViewer({
        objectNameSingular: 'opportunity',
        isAdmin: true,
      }),
    ).toEqual([]);
    expect(
      getDealAdminOnlyFieldNamesForViewer({
        objectNameSingular: 'company',
        isAdmin: false,
      }),
    ).toEqual([]);
  });
});
