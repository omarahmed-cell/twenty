import { type CompanyParentChildCompany } from '@/page-layout/widgets/field/types/CompanyParentChildCompany';
import { type CompanyParentChildLabel } from '@/page-layout/widgets/field/types/CompanyParentChildLabel';
import { isDefined } from 'twenty-shared/utils';

type GetCompanyParentChildUpdateParams = {
  currentCompany: CompanyParentChildCompany;
  pickedCompany: CompanyParentChildCompany;
  label: CompanyParentChildLabel;
};

export const getCompanyParentChildUpdate = ({
  currentCompany,
  pickedCompany,
  label,
}: GetCompanyParentChildUpdateParams) => {
  const companyToUpdate = label === 'child' ? pickedCompany : currentCompany;
  const newParentCompany = label === 'child' ? currentCompany : pickedCompany;

  const existingParentCompany = companyToUpdate.parentCompany;

  const replacedParentCompany =
    isDefined(existingParentCompany) &&
    existingParentCompany.id !== newParentCompany.id
      ? existingParentCompany
      : null;

  return {
    companyToUpdate,
    newParentCompanyId: newParentCompany.id,
    replacedParentCompany,
  };
};
