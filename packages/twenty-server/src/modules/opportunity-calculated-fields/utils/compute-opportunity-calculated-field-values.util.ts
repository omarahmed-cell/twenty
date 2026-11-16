import { isNonEmptyString } from '@sniptt/guards';
import { getDealStageStatus, isDefined } from 'twenty-shared/utils';

import { COMPANY_ACTIVITY_DATE_SOURCES } from 'src/modules/company-calculated-fields/constants/company-activity-date-sources.constant';
import { pickLatestActivityDate } from 'src/modules/company-calculated-fields/utils/pick-latest-activity-date.util';
import {
  type NextActivityCandidate,
  pickNextActivityDate,
} from 'src/modules/company-calculated-fields/utils/pick-next-activity-date.util';
import {
  type CurrencyValue,
  type OpportunityCalculatedFieldValues,
} from 'src/modules/opportunity-calculated-fields/constants/opportunity-calculated-field-names.constant';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1_000;

export type OpportunityCalculationInput = {
  pointOfContactId: string | null;
  contactPersonIds: (string | null)[] | null;
  lineItemCount: number;
  activityDates: { activityType: string; date: string | Date | null }[] | null;
  nextActivityCandidates: NextActivityCandidate[] | null;
  stageProbability?: number | string | null;
  amountMicros?: number | string | null;
  amountCurrencyCode?: string | null;
  createdAt?: string | Date | null;
  closeDate?: string | Date | null;
};

const toNumberOrNull = (value: number | string | null | undefined) => {
  if (!isDefined(value) || value === '') {
    return null;
  }

  const number = Number(value);

  return Number.isNaN(number) ? null : number;
};

// Same currency as Amount; empty when Amount or the probability is
const computeWeightedAmount = ({
  amountMicros,
  currencyCode,
  probability,
}: {
  amountMicros: number | null;
  currencyCode: string | null | undefined;
  probability: number | null;
}): CurrencyValue | null =>
  isDefined(amountMicros) && isDefined(probability)
    ? {
        amountMicros: Math.round((amountMicros * probability) / 100),
        currencyCode: currencyCode ?? null,
      }
    : null;

const computeActualDuration = ({
  isClosed,
  createdAt,
  closeDate,
}: {
  isClosed: boolean;
  createdAt: string | Date | null | undefined;
  closeDate: string | Date | null | undefined;
}) => {
  if (!isClosed || !isDefined(createdAt) || !isDefined(closeDate)) {
    return null;
  }

  const days =
    (new Date(closeDate).getTime() - new Date(createdAt).getTime()) /
    MILLISECONDS_PER_DAY;

  return Number.isNaN(days) ? null : Math.max(0, Math.floor(days));
};

export const computeOpportunityCalculatedFieldValues = ({
  input,
  now,
}: {
  input: OpportunityCalculationInput;
  now: Date;
}): OpportunityCalculatedFieldValues => {
  const probability = toNumberOrNull(input.stageProbability);
  const status = getDealStageStatus(probability);
  const isClosed = status !== 'OPEN';

  return {
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
    dealProbability: isDefined(probability) ? probability / 100 : null,
    weightedAmount: computeWeightedAmount({
      amountMicros: toNumberOrNull(input.amountMicros),
      currencyCode: input.amountCurrencyCode,
      probability,
    }),
    isClosed,
    isClosedWon: status === 'WON',
    isClosedLost: status === 'LOST',
    isOpen: !isClosed,
    actualDuration: computeActualDuration({
      isClosed,
      createdAt: input.createdAt,
      closeDate: input.closeDate,
    }),
  };
};
