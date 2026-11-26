import { isNonEmptyString } from '@sniptt/guards';

import { COMPANY_ACTIVITY_DATE_SOURCES } from 'src/modules/company-calculated-fields/constants/company-activity-date-sources.constant';

type OpportunityCalculationRecord = Record<string, unknown> | undefined;

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

export const OPPORTUNITY_CALCULATION_WATCHED_OBJECT_NAMES = new Set([
  'opportunity',
  'opportunityContact',
  'lineItem',
  'person',
  ...ACTIVITY_TYPES,
  ...TARGET_TABLE_NAMES,
]);

const hasChanged = (
  before: OpportunityCalculationRecord,
  after: OpportunityCalculationRecord,
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
  records: OpportunityCalculationRecord[],
) =>
  records
    .map((record) => record?.[fieldName])
    .filter(isNonEmptyString)
    .map((recordId) => `${objectName}:${recordId}`);

// References name the records whose deals need recomputing; the job resolves them to deals
export const collectOpportunityCalculationReferences = ({
  objectNameSingular,
  isUpdate,
  before,
  after,
}: {
  objectNameSingular: string;
  isUpdate: boolean;
  before: OpportunityCalculationRecord;
  after: OpportunityCalculationRecord;
}): string[] => {
  const records = [before, after];

  switch (true) {
    case objectNameSingular === 'opportunity':
      if (
        isUpdate &&
        !hasChanged(before, after, [
          'pointOfContactId',
          'dealAmount',
          'currency',
          'exchangeRate',
          'exchangeRateMode',
          'stage',
          'pipeline',
          'closeDate',
          'createdAt',
        ])
      ) {
        return [];
      }

      return referencesFrom('opportunity', 'id', records);
    case objectNameSingular === 'opportunityContact':
      return referencesFrom('opportunity', 'opportunityId', records);
    case objectNameSingular === 'lineItem':
      if (isUpdate && !hasChanged(before, after, ['dealId', 'deletedAt'])) {
        return [];
      }

      return referencesFrom('opportunity', 'dealId', records);
    // Deleting or restoring a person changes who is counted on their deals
    case objectNameSingular === 'person':
      return isUpdate ? [] : referencesFrom('person', 'id', records);
    case ACTIVITY_TYPES.has(objectNameSingular):
      if (isUpdate && !hasChanged(before, after, ACTIVITY_DATE_FIELD_NAMES)) {
        return [];
      }

      return referencesFrom(objectNameSingular, 'id', records);
    case TARGET_TABLE_NAMES.has(objectNameSingular):
      return referencesFrom('opportunity', 'targetOpportunityId', records);
    default:
      return [];
  }
};
