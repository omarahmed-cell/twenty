import { COMPANY_LIFECYCLE_STAGE_DATE_TRACKING_CONFIG } from 'src/modules/stage-date-tracking/constants/company-lifecycle-stage-date-tracking-config.constant';
import { PERSON_LIFECYCLE_STAGE_DATE_TRACKING_CONFIG } from 'src/modules/stage-date-tracking/constants/person-lifecycle-stage-date-tracking-config.constant';
import { type StageDateTrackingConfig } from 'src/modules/stage-date-tracking/types/stage-date-tracking-config.type';

// Add a SELECT field here (with its generated date fields) to track its stage dates
export const STAGE_DATE_TRACKING_CONFIGS: StageDateTrackingConfig[] = [
  COMPANY_LIFECYCLE_STAGE_DATE_TRACKING_CONFIG,
  PERSON_LIFECYCLE_STAGE_DATE_TRACKING_CONFIG,
];
