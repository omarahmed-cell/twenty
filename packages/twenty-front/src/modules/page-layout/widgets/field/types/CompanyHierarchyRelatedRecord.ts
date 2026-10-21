import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export type CompanyHierarchyRelatedRecord = {
  record: ObjectRecord;
  hierarchyRole: 'parent' | 'child';
};
