import { isDefined } from 'twenty-shared/utils';

export type CompanyParentAssignmentViolation = 'SELF_PARENT' | 'CYCLE';

// Walks up from the new parent; reaching the company itself means it would sit below its own descendant
export const findCompanyParentAssignmentViolation = async ({
  companyId,
  newParentCompanyId,
  getParentCompanyId,
}: {
  companyId: string;
  newParentCompanyId: string;
  getParentCompanyId: (companyId: string) => Promise<string | null>;
}): Promise<CompanyParentAssignmentViolation | null> => {
  if (newParentCompanyId === companyId) {
    return 'SELF_PARENT';
  }

  const visitedCompanyIds = new Set<string>();
  let ancestorCompanyId: string | null = newParentCompanyId;

  while (isDefined(ancestorCompanyId)) {
    if (ancestorCompanyId === companyId) {
      return 'CYCLE';
    }

    // A loop already stored higher up must not hang the walk
    if (visitedCompanyIds.has(ancestorCompanyId)) {
      return null;
    }

    visitedCompanyIds.add(ancestorCompanyId);
    ancestorCompanyId = await getParentCompanyId(ancestorCompanyId);
  }

  return null;
};
