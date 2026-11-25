import { type RoboostMergeObjectName } from './RoboostMergeConfig';

export type RoboostDuplicateConfidence = 'EXACT' | 'HIGH' | 'POSSIBLE';

export type RoboostDuplicatePairStatus = 'OPEN' | 'REJECTED' | 'MERGED';

export type RoboostDuplicateRuleKey =
  | 'companySameDomain'
  | 'companySimilarNameSameCountry'
  | 'personSameEmail'
  | 'personSamePhone'
  | 'personSameNameSameCompany'
  | 'opportunitySameNameCompanyAmount'
  | 'opportunityRequireSameOwner'
  | 'serviceSameNameSameCompany';

export type RoboostDuplicateRule = {
  key: RoboostDuplicateRuleKey;
  objectName: RoboostMergeObjectName;
  label: string;
  // Options refine another rule instead of producing pairs
  confidence: RoboostDuplicateConfidence | null;
  defaultEnabled: boolean;
};

export const ROBOOST_DUPLICATE_RULES: RoboostDuplicateRule[] = [
  {
    key: 'companySameDomain',
    objectName: 'company',
    label: 'Same domain (primary or extra)',
    confidence: 'EXACT',
    defaultEnabled: true,
  },
  {
    key: 'companySimilarNameSameCountry',
    objectName: 'company',
    label: 'Similar name and same country',
    confidence: 'POSSIBLE',
    defaultEnabled: true,
  },
  {
    key: 'personSameEmail',
    objectName: 'person',
    label: 'Same email (primary or additional)',
    confidence: 'EXACT',
    defaultEnabled: true,
  },
  {
    key: 'personSamePhone',
    objectName: 'person',
    label: 'Same phone',
    confidence: 'HIGH',
    defaultEnabled: true,
  },
  {
    key: 'personSameNameSameCompany',
    objectName: 'person',
    label: 'Similar full name and same company',
    confidence: 'HIGH',
    defaultEnabled: true,
  },
  {
    key: 'opportunitySameNameCompanyAmount',
    objectName: 'opportunity',
    label: 'Same name, same company and amount within 10%',
    confidence: 'HIGH',
    defaultEnabled: true,
  },
  {
    key: 'opportunityRequireSameOwner',
    objectName: 'opportunity',
    label: 'Also require the same deal owner',
    confidence: null,
    defaultEnabled: false,
  },
  {
    key: 'serviceSameNameSameCompany',
    objectName: 'service',
    label: 'Same name and same company',
    confidence: 'HIGH',
    defaultEnabled: true,
  },
];

export const ROBOOST_DUPLICATE_CONFIDENCE_RANK: Record<
  RoboostDuplicateConfidence,
  number
> = {
  EXACT: 3,
  HIGH: 2,
  POSSIBLE: 1,
};
