import { findCompanyParentAssignmentViolation } from 'src/modules/company-hierarchy/utils/find-company-parent-assignment-violation.util';

const buildParentLookup =
  (parentByCompanyId: Record<string, string | null>) =>
  async (companyId: string) =>
    parentByCompanyId[companyId] ?? null;

describe('findCompanyParentAssignmentViolation', () => {
  it('refuses a company as its own parent', async () => {
    await expect(
      findCompanyParentAssignmentViolation({
        companyId: 'shahia',
        newParentCompanyId: 'shahia',
        getParentCompanyId: buildParentLookup({}),
      }),
    ).resolves.toBe('SELF_PARENT');
  });

  it('refuses making a child the parent of its own parent', async () => {
    await expect(
      findCompanyParentAssignmentViolation({
        companyId: 'shahia',
        newParentCompanyId: 'namq',
        getParentCompanyId: buildParentLookup({ namq: 'shahia' }),
      }),
    ).resolves.toBe('CYCLE');
  });

  it('refuses a descendant several levels down', async () => {
    await expect(
      findCompanyParentAssignmentViolation({
        companyId: 'group',
        newParentCompanyId: 'branch',
        getParentCompanyId: buildParentLookup({
          branch: 'brand',
          brand: 'group',
          group: null,
        }),
      }),
    ).resolves.toBe('CYCLE');
  });

  it('accepts a parent outside the company tree', async () => {
    await expect(
      findCompanyParentAssignmentViolation({
        companyId: 'namq',
        newParentCompanyId: 'shahia',
        getParentCompanyId: buildParentLookup({ shahia: 'holding' }),
      }),
    ).resolves.toBeNull();
  });

  it('stops on a loop already stored above the new parent', async () => {
    await expect(
      findCompanyParentAssignmentViolation({
        companyId: 'newcomer',
        newParentCompanyId: 'a',
        getParentCompanyId: buildParentLookup({ a: 'b', b: 'a' }),
      }),
    ).resolves.toBeNull();
  });
});
