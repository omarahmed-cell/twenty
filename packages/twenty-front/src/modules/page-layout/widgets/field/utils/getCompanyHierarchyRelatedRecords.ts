import { isObject } from '@sniptt/guards';

import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type CompanyHierarchyRelatedRecord } from '@/page-layout/widgets/field/types/CompanyHierarchyRelatedRecord';

const isRecord = (value: unknown): value is ObjectRecord =>
  isObject(value) && 'id' in value;

export const getCompanyHierarchyRelatedRecords = ({
  parentCompany,
  childCompanies,
}: {
  parentCompany: unknown;
  childCompanies: unknown;
}): CompanyHierarchyRelatedRecord[] => {
  const parentRecords: CompanyHierarchyRelatedRecord[] = isRecord(parentCompany)
    ? [{ record: parentCompany, hierarchyRole: 'parent' }]
    : [];

  const childRecords: CompanyHierarchyRelatedRecord[] = Array.isArray(
    childCompanies,
  )
    ? childCompanies
        .filter(isRecord)
        .map((record) => ({ record, hierarchyRole: 'child' }))
    : [];

  return [...parentRecords, ...childRecords];
};
