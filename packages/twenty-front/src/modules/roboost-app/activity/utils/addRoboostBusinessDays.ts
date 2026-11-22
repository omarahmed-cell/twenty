const WORK_DAY_START_HOUR = 9;

// Saturday and Sunday are skipped; the due time is the start of the work day
export const addRoboostBusinessDays = (from: Date, businessDays: number) => {
  const date = new Date(from);
  let remaining = businessDays;

  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const weekDay = date.getDay();

    if (weekDay !== 0 && weekDay !== 6) {
      remaining -= 1;
    }
  }
  date.setHours(WORK_DAY_START_HOUR, 0, 0, 0);

  return date;
};
