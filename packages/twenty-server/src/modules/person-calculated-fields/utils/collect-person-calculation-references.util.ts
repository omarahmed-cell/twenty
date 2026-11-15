import { isNonEmptyString } from '@sniptt/guards';

import { COMPANY_ACTIVITY_DATE_SOURCES } from 'src/modules/company-calculated-fields/constants/company-activity-date-sources.constant';

type PersonCalculationRecord = Record<string, unknown> | undefined;

const ACTIVITY_TYPES = new Set(
  COMPANY_ACTIVITY_DATE_SOURCES.map(({ activityType }) => activityType),
);
const TARGET_TABLE_NAMES = new Set(
  COMPANY_ACTIVITY_DATE_SOURCES.map(({ targetTableName }) => targetTableName),
);
const ACTIVITY_DATE_FIELD_NAMES = [
  'createdAt',
  'startsAt',
  'dueAt',
  'sentAt',
  'status',
  'deletedAt',
];
const OPPORTUNITY_FIELD_NAMES = ['pointOfContactId', 'createdAt', 'deletedAt'];

export const PERSON_CALCULATION_WATCHED_OBJECT_NAMES = new Set([
  'opportunity',
  'opportunityContact',
  ...ACTIVITY_TYPES,
  ...TARGET_TABLE_NAMES,
]);

const hasChanged = (
  before: PersonCalculationRecord,
  after: PersonCalculationRecord,
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
  records: PersonCalculationRecord[],
) =>
  records
    .map((record) => record?.[fieldName])
    .filter(isNonEmptyString)
    .map((recordId) => `${objectName}:${recordId}`);

// References name the records whose people need recomputing; the job resolves them to people
export const collectPersonCalculationReferences = ({
  objectNameSingular,
  isUpdate,
  before,
  after,
}: {
  objectNameSingular: string;
  isUpdate: boolean;
  before: PersonCalculationRecord;
  after: PersonCalculationRecord;
}): string[] => {
  const records = [before, after];

  switch (true) {
    case objectNameSingular === 'opportunity':
      if (isUpdate && !hasChanged(before, after, OPPORTUNITY_FIELD_NAMES)) {
        return [];
      }

      return [
        ...referencesFrom('person', 'pointOfContactId', records),
        ...referencesFrom('opportunity', 'id', records),
      ];
    case objectNameSingular === 'opportunityContact':
      return referencesFrom('person', 'personId', records);
    case ACTIVITY_TYPES.has(objectNameSingular):
      if (isUpdate && !hasChanged(before, after, ACTIVITY_DATE_FIELD_NAMES)) {
        return [];
      }

      return referencesFrom(objectNameSingular, 'id', records);
    case TARGET_TABLE_NAMES.has(objectNameSingular):
      return referencesFrom('person', 'targetPersonId', records);
    default:
      return [];
  }
};
