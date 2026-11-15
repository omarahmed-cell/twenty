import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { COMPANY_ACTIVITY_DATE_SOURCES } from 'src/modules/company-calculated-fields/constants/company-activity-date-sources.constant';
import { pickLatestActivityDate } from 'src/modules/company-calculated-fields/utils/pick-latest-activity-date.util';
import { type PersonCalculatedFieldValues } from 'src/modules/person-calculated-fields/constants/person-calculated-field-names.constant';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1_000;

export type PersonCalculationInput = {
  lifecycleStage: string | null;
  dateEnteredCurrentStage: string | Date | null;
  dealCreatedDates: (string | Date | null)[] | null;
  activityDates: { activityType: string; date: string | Date | null }[] | null;
};

const toTimestamp = (date: string | Date | null | undefined) =>
  isDefined(date) ? new Date(date).getTime() : Number.NaN;

export const computePersonCalculatedFieldValues = ({
  input,
  now,
}: {
  input: PersonCalculationInput;
  now: Date;
}): PersonCalculatedFieldValues => {
  const dealCreatedTimestamps = (input.dealCreatedDates ?? [])
    .map(toTimestamp)
    .filter((timestamp) => !Number.isNaN(timestamp));

  const enteredCurrentStageTimestamp = toTimestamp(
    input.dateEnteredCurrentStage,
  );

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
    firstDealCreatedDate:
      dealCreatedTimestamps.length === 0
        ? null
        : new Date(Math.min(...dealCreatedTimestamps)).toISOString(),
    timeInCurrentStage:
      !isNonEmptyString(input.lifecycleStage) ||
      Number.isNaN(enteredCurrentStageTimestamp)
        ? null
        : Math.max(
            0,
            Math.floor(
              (now.getTime() - enteredCurrentStageTimestamp) /
                MILLISECONDS_PER_DAY,
            ),
          ),
  };
};
