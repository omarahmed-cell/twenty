// Week days follow Date.getDay(): 0 is Sunday, 6 is Saturday
export type WorkingDaysConfig = {
  days: number[];
  // Local time a work day starts, "HH:MM"
  startTime: string;
};

export const DEFAULT_WORKING_DAYS_CONFIG: WorkingDaysConfig = {
  days: [0, 1, 2, 3, 4],
  startTime: '08:00',
};

const MAX_DAYS_SEARCHED = 14;

const getWorkingDays = (config: WorkingDaysConfig) =>
  config.days.length > 0 ? config.days : DEFAULT_WORKING_DAYS_CONFIG.days;

export const isWorkingDay = (date: Date, config: WorkingDaysConfig) =>
  getWorkingDays(config).includes(date.getDay());

export const setWorkDayStartTime = (date: Date, config: WorkingDaysConfig) => {
  const [hours = Number.NaN, minutes = Number.NaN] = config.startTime
    .split(':')
    .map((part) => Number.parseInt(part, 10));
  const result = new Date(date);

  result.setHours(
    Number.isFinite(hours) ? hours : 8,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0,
  );

  return result;
};

// The same day when it is a working day, otherwise the next working day
export const moveToWorkingDay = (date: Date, config: WorkingDaysConfig) => {
  const result = new Date(date);

  for (let step = 0; step < MAX_DAYS_SEARCHED; step++) {
    if (isWorkingDay(result, config)) {
      return result;
    }
    result.setDate(result.getDate() + 1);
  }

  return result;
};

// The first working day strictly after the given date
export const nextBusinessDay = (date: Date, config: WorkingDaysConfig) => {
  const result = new Date(date);

  result.setDate(result.getDate() + 1);

  return moveToWorkingDay(result, config);
};

export const addBusinessDays = (
  date: Date,
  businessDays: number,
  config: WorkingDaysConfig,
) => {
  let result = new Date(date);

  for (let count = 0; count < businessDays; count++) {
    result = nextBusinessDay(result, config);
  }

  return result;
};
