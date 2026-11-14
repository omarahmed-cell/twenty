import { isNonEmptyString } from '@sniptt/guards';

import { COMPANY_ACTIVITY_DATE_SOURCES } from 'src/modules/company-calculated-fields/constants/company-activity-date-sources.constant';

export type CompanyCalculationRecord = Record<string, unknown> | undefined;

const ACTIVITY_TYPES = new Set(
  COMPANY_ACTIVITY_DATE_SOURCES.map(({ activityType }) => activityType),
);
const TARGET_TABLE_NAMES = new Set(
  COMPANY_ACTIVITY_DATE_SOURCES.map(({ targetTableName }) => targetTableName),
);
const ACTIVITY_DATE_FIELD_NAMES = [
  'createdAt',
  'startsAt',
  'sentAt',
  'status',
  'deletedAt',
];

export const COMPANY_CALCULATION_WATCHED_OBJECT_NAMES = new Set([
  'company',
  'person',
  'opportunity',
  ...ACTIVITY_TYPES,
  ...TARGET_TABLE_NAMES,
]);

const hasChanged = (
  before: CompanyCalculationRecord,
  after: CompanyCalculationRecord,
  fieldNames: string[],
) =>
  fieldNames.some(
    (fieldName) =>
      JSON.stringify(before?.[fieldName] ?? null) !==
      JSON.stringify(after?.[fieldName] ?? null),
  );

const referencesFrom = (
  objectName: string,
  fieldName: string,
  records: CompanyCalculationRecord[],
) =>
  records
    .map((record) => record?.[fieldName])
    .filter(isNonEmptyString)
    .map((recordId) => `${objectName}:${recordId}`);

// References name the records whose companies need recomputing; the job resolves them to companies
export const collectCompanyCalculationReferences = ({
  objectNameSingular,
  isUpdate,
  before,
  after,
}: {
  objectNameSingular: string;
  isUpdate: boolean;
  before: CompanyCalculationRecord;
  after: CompanyCalculationRecord;
}): string[] => {
  const records = [before, after];

  switch (true) {
    case objectNameSingular === 'company':
      if (isUpdate && !hasChanged(before, after, ['parentCompanyId'])) {
        return [];
      }

      return [
        ...referencesFrom('company', 'id', records),
        ...referencesFrom('company', 'parentCompanyId', records),
      ];
    case objectNameSingular === 'person':
      if (isUpdate && !hasChanged(before, after, ['companyId'])) {
        return [];
      }

      return referencesFrom('company', 'companyId', records);
    case objectNameSingular === 'opportunity':
      if (isUpdate && !hasChanged(before, after, ['companyId', 'stage'])) {
        return [];
      }

      return referencesFrom('company', 'companyId', records);
    case ACTIVITY_TYPES.has(objectNameSingular):
      if (isUpdate && !hasChanged(before, after, ACTIVITY_DATE_FIELD_NAMES)) {
        return [];
      }

      return referencesFrom(objectNameSingular, 'id', records);
    case TARGET_TABLE_NAMES.has(objectNameSingular):
      return [
        ...referencesFrom('company', 'targetCompanyId', records),
        ...referencesFrom('person', 'targetPersonId', records),
        ...referencesFrom('opportunity', 'targetOpportunityId', records),
      ];
    default:
      return [];
  }
};
