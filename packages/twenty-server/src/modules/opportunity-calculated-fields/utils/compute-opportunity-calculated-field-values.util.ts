import { isNonEmptyString } from '@sniptt/guards';

import { COMPANY_ACTIVITY_DATE_SOURCES } from 'src/modules/company-calculated-fields/constants/company-activity-date-sources.constant';
import { pickLatestActivityDate } from 'src/modules/company-calculated-fields/utils/pick-latest-activity-date.util';
import {
  type NextActivityCandidate,
  pickNextActivityDate,
} from 'src/modules/company-calculated-fields/utils/pick-next-activity-date.util';
import { type OpportunityCalculatedFieldValues } from 'src/modules/opportunity-calculated-fields/constants/opportunity-calculated-field-names.constant';

export type OpportunityCalculationInput = {
  pointOfContactId: string | null;
  contactPersonIds: (string | null)[] | null;
  lineItemCount: number;
  activityDates: { activityType: string; date: string | Date | null }[] | null;
  nextActivityCandidates: NextActivityCandidate[] | null;
};

export const computeOpportunityCalculatedFieldValues = ({
  input,
  now,
}: {
  input: OpportunityCalculationInput;
  now: Date;
}): OpportunityCalculatedFieldValues => ({
  lastActivityDate: pickLatestActivityDate({
    now,
    candidates: (input.activityDates ?? []).map(({ activityType, date }) => ({
      activityType,
      date,
      countsOnlyOncePast: COMPANY_ACTIVITY_DATE_SOURCES.find(
        (source) => source.activityType === activityType,
      )?.countsOnlyOncePast,
    })),
  }),
  nextActivityDate: pickNextActivityDate({
    now,
    candidates: input.nextActivityCandidates ?? [],
  }),
  numberOfAssociatedContacts: new Set(
    [...(input.contactPersonIds ?? []), input.pointOfContactId].filter(
      isNonEmptyString,
    ),
  ).size,
  numberOfAssociatedLineItems: input.lineItemCount,
});
