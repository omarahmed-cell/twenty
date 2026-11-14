import { isNonEmptyString } from '@sniptt/guards';

import { type CompanyParentAssignment } from 'src/modules/company-hierarchy/services/company-hierarchy-validation.service';

type CompanyWriteData = {
  id?: string;
  parentCompanyId?: string | null;
  domainName?: { primaryLinkUrl?: string | null } | null;
};

// Clearing a parent can never create a loop, so only non-empty parents need checking
export const getCompanyParentAssignment = (
  data: CompanyWriteData,
  companyId?: string,
): CompanyParentAssignment | null => {
  if (!isNonEmptyString(data.parentCompanyId)) {
    return null;
  }

  const domainPrimaryLinkUrl = data.domainName?.primaryLinkUrl;

  return {
    companyId: companyId ?? data.id,
    domainPrimaryLinkUrl: isNonEmptyString(domainPrimaryLinkUrl)
      ? domainPrimaryLinkUrl
      : undefined,
    parentCompanyId: data.parentCompanyId,
  };
};
