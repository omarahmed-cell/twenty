import { CoreObjectNameSingular } from 'twenty-shared/types';

export const isCompanyHierarchyField = ({
  objectNameSingular,
  fieldName,
}: {
  objectNameSingular: string;
  fieldName: string;
}) =>
  objectNameSingular === CoreObjectNameSingular.Company &&
  fieldName === 'childCompanies';
