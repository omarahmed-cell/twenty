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
  dealAmount?: number | string | null;
  currency?: string | null;
  companyCurrency?: string | null;
  latestRate?: number | string | null;
  closeDateRate?: number | string | null;
  currentExchangeRate?: number | string | null;
  currentExchangeRateMode?: string | null;
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

export type ExchangeRateMode = 'AUTO' | 'FROZEN' | 'MANUAL';

// Open deals follow the latest rate; a deal closed on or before today is frozen at its close date rate;
// an admin's rate stays until the currency changes
export const computeDealExchangeRate = ({
  currency,
  companyCurrency,
  isClosed,
  closeDate,
  now,
  latestRate,
  closeDateRate,
  currentExchangeRate,
  currentExchangeRateMode,
}: {
  currency: string | null | undefined;
  companyCurrency: string | null | undefined;
  isClosed: boolean;
  closeDate: string | Date | null | undefined;
  now: Date;
  latestRate: number | null;
  closeDateRate: number | null;
  currentExchangeRate: number | null;
  currentExchangeRateMode: string | null | undefined;
}): { exchangeRate: number | null; exchangeRateMode: ExchangeRateMode } => {
  const isClosedInThePast =
    isClosed &&
    isDefined(closeDate) &&
    new Date(closeDate).toISOString().slice(0, 10) <=
      now.toISOString().slice(0, 10);

  if (currentExchangeRateMode === 'MANUAL' && isDefined(currentExchangeRate)) {
    return { exchangeRate: currentExchangeRate, exchangeRateMode: 'MANUAL' };
  }
  if (!isNonEmptyString(currency)) {
    return { exchangeRate: null, exchangeRateMode: 'AUTO' };
  }
  if (isClosedInThePast) {
    if (
      currentExchangeRateMode === 'FROZEN' &&
      isDefined(currentExchangeRate)
    ) {
      return { exchangeRate: currentExchangeRate, exchangeRateMode: 'FROZEN' };
    }

    return {
      exchangeRate: currency === companyCurrency ? 1 : closeDateRate,
      exchangeRateMode: 'FROZEN',
    };
  }

  return {
    exchangeRate: currency === companyCurrency ? 1 : latestRate,
    exchangeRateMode: 'AUTO',
  };
};

const toCurrencyValue = (
  amount: number | null,
  currencyCode: string | null | undefined,
): CurrencyValue | null =>
  isDefined(amount) && Number.isFinite(amount)
    ? {
        amountMicros: Math.round(amount * 1_000_000),
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
  const dealAmount = toNumberOrNull(input.dealAmount);
  const { exchangeRate, exchangeRateMode } = computeDealExchangeRate({
    currency: input.currency,
    companyCurrency: input.companyCurrency,
    isClosed,
    closeDate: input.closeDate,
    now,
    latestRate: toNumberOrNull(input.latestRate),
    closeDateRate: toNumberOrNull(input.closeDateRate),
    currentExchangeRate: toNumberOrNull(input.currentExchangeRate),
    currentExchangeRateMode: input.currentExchangeRateMode,
  });
  const amountInCompanyCurrency =
    isDefined(dealAmount) && isDefined(exchangeRate)
      ? dealAmount * exchangeRate
      : null;

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
      amountMicros: isDefined(dealAmount)
        ? Math.round(dealAmount * 1_000_000)
        : null,
      currencyCode: input.currency,
      probability,
    }),
    exchangeRate,
    exchangeRateMode,
    amountInCompanyCurrency: toCurrencyValue(
      amountInCompanyCurrency,
      input.companyCurrency,
    ),
    weightedAmountInCompanyCurrency: toCurrencyValue(
      isDefined(amountInCompanyCurrency) && isDefined(probability)
        ? (amountInCompanyCurrency * probability) / 100
        : null,
      input.companyCurrency,
    ),
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
