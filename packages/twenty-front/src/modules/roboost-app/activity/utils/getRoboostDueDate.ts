import {
  addBusinessDays,
  moveToWorkingDay,
  setWorkDayStartTime,
  type WorkingDaysConfig,
} from 'twenty-shared/utils';

export type RoboostDueDateOption =
  | 'today'
  | 'tomorrow'
  | 'businessDays2'
  | 'businessDays3'
  | 'week1'
  | 'weeks2'
  | 'month1'
  | 'months3'
  | 'custom';

export const ROBOOST_DUE_DATE_OPTIONS: RoboostDueDateOption[] = [
  'today',
  'tomorrow',
  'businessDays2',
  'businessDays3',
  'week1',
  'weeks2',
  'month1',
  'months3',
  'custom',
];

export const ROBOOST_DEFAULT_DUE_DATE_OPTION: RoboostDueDateOption =
  'businessDays3';

const addCalendarDays = (date: Date, days: number) => {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
};

const addMonths = (date: Date, months: number) => {
  const result = new Date(date);

  result.setMonth(result.getMonth() + months);

  return result;
};

const withTime = (date: Date, time: string, config: WorkingDaysConfig) =>
  setWorkDayStartTime(date, { ...config, startTime: time });

// Business-day picks skip non-working days; plain dates that land on one move to the next working day
export const getRoboostDueDate = ({
  option,
  now,
  time,
  customDate,
  config,
}: {
  option: RoboostDueDateOption;
  now: Date;
  time: string;
  customDate?: string;
  config: WorkingDaysConfig;
}): Date => {
  switch (option) {
    case 'businessDays2':
      return withTime(addBusinessDays(now, 2, config), time, config);
    case 'businessDays3':
      return withTime(addBusinessDays(now, 3, config), time, config);
    case 'custom': {
      const [year, month, day] = (customDate ?? '')
        .split('-')
        .map((part) => Number.parseInt(part, 10));
      const date =
        Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
          ? new Date(year, month - 1, day)
          : now;

      return withTime(date, time, config);
    }
    default: {
      const plainDateByOption: Record<string, Date> = {
        today: now,
        tomorrow: addCalendarDays(now, 1),
        week1: addCalendarDays(now, 7),
        weeks2: addCalendarDays(now, 14),
        month1: addMonths(now, 1),
        months3: addMonths(now, 3),
      };

      return withTime(
        moveToWorkingDay(plainDateByOption[option] ?? now, config),
        time,
        config,
      );
    }
  }
};
