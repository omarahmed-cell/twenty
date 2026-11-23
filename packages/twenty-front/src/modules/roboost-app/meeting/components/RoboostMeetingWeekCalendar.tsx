import {
  addDaysToDateString,
  getWeekdayOfDateString,
  minutesToTimeString,
  timeStringToMinutes,
  toZonedDateString,
  toZonedTimeString,
} from '@/roboost-app/meeting/utils/zonedTime';
import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Select } from '@/roboost-ui/components/Select';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { type WorkingDaysConfig } from 'twenty-shared/utils';

export type RoboostCalendarSlot = {
  startsAt: string;
  endsAt: string;
  title: string | null;
};

type RoboostMeetingWeekCalendarProps = {
  weekStart: string;
  onWeekStartChange: (weekStart: string) => void;
  timeZone: string;
  timeZoneOptions: string[];
  onTimeZoneChange: (timeZone: string) => void;
  workingDays: WorkingDaysConfig;
  slots: RoboostCalendarSlot[];
  calendarNotice: string | null;
  isLoading: boolean;
  selectedDate: string;
  selectedStartTime: string;
  selectedEndTime: string;
  onSelect: (selection: {
    date: string;
    startTime: string;
    endTime: string;
  }) => void;
};

const HOUR_HEIGHT = 48;
const STEP_MINUTES = 30;
const DEFAULT_DURATION_MINUTES = 30;

export const getWeekStart = (date: string) =>
  addDaysToDateString(date, -getWeekdayOfDateString(date));

// The host's week: busy blocks, the chosen slot in the accent colour, click or drag to pick a time
export const RoboostMeetingWeekCalendar = ({
  weekStart,
  onWeekStartChange,
  timeZone,
  timeZoneOptions,
  onTimeZoneChange,
  workingDays,
  slots,
  calendarNotice,
  isLoading,
  selectedDate,
  selectedStartTime,
  selectedEndTime,
  onSelect,
}: RoboostMeetingWeekCalendarProps) => {
  const { t } = useLingui();
  const [hideNonWorkingDays, setHideNonWorkingDays] = useState(true);
  const [drag, setDrag] = useState<{
    date: string;
    from: number;
    to: number;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = Array.from({ length: 7 }, (_, index) =>
    addDaysToDateString(weekStart, index),
  ).filter(
    (date) =>
      !hideNonWorkingDays ||
      workingDays.days.includes(getWeekdayOfDateString(date)),
  );
  const today = toZonedDateString(new Date(), timeZone);
  const dayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const titleFormat = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  const toUtcDate = (date: string) => new Date(`${date}T00:00:00Z`);
  const lastDay = days[days.length - 1] ?? weekStart;
  const weekTitle = `${titleFormat.format(toUtcDate(days[0] ?? weekStart))} – ${titleFormat.format(toUtcDate(lastDay))}, ${lastDay.slice(0, 4)}`;

  // Opens on the start of the work day
  useEffect(() => {
    const startMinutes = timeStringToMinutes(workingDays.startTime);

    scrollRef.current?.scrollTo({ top: (startMinutes / 60) * HOUR_HEIGHT });
  }, [workingDays.startTime]);

  const minutesAt = (clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const minutes = ((clientY - rect.top) / HOUR_HEIGHT) * 60;

    return Math.max(
      0,
      Math.min(
        24 * 60 - STEP_MINUTES,
        Math.floor(minutes / STEP_MINUTES) * STEP_MINUTES,
      ),
    );
  };

  const finishDrag = () => {
    if (drag === null) {
      return;
    }
    const start = Math.min(drag.from, drag.to);
    const end = Math.max(drag.from, drag.to) + STEP_MINUTES;
    const duration =
      end - start > STEP_MINUTES
        ? end - start
        : Math.max(
            DEFAULT_DURATION_MINUTES,
            timeStringToMinutes(selectedEndTime) -
              timeStringToMinutes(selectedStartTime),
          );

    onSelect({
      date: drag.date,
      startTime: minutesToTimeString(start),
      endTime: minutesToTimeString(Math.min(start + duration, 24 * 60 - 1)),
    });
    setDrag(null);
  };

  const slotsOfDay = (date: string) =>
    slots
      .map((slot) => {
        const start = new Date(slot.startsAt);
        const end = new Date(slot.endsAt);

        if (toZonedDateString(start, timeZone) !== date) {
          return null;
        }
        const top = timeStringToMinutes(toZonedTimeString(start, timeZone));
        const endDate = toZonedDateString(end, timeZone);
        const bottom =
          endDate === date
            ? timeStringToMinutes(toZonedTimeString(end, timeZone))
            : 24 * 60;

        return { ...slot, top, height: Math.max(bottom - top, 15) };
      })
      .filter((slot) => slot !== null);

  const selectionTop = timeStringToMinutes(selectedStartTime);
  const selectionHeight = Math.max(
    timeStringToMinutes(selectedEndTime) - selectionTop,
    15,
  );

  return (
    <div className="rb-mtg-cal">
      <div className="rb-mtg-cal-head">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onWeekStartChange(getWeekStart(today))}
        >
          {t`Today`}
        </Button>
        <div className="rb-mtg-cal-title">{weekTitle}</div>
        <div className="rb-mtg-cal-nav">
          <Button
            size="sm"
            variant="ghost"
            iconOnly
            icon="chevron-left"
            aria-label={t`Previous week`}
            onClick={() =>
              onWeekStartChange(addDaysToDateString(weekStart, -7))
            }
          />
          <Button
            size="sm"
            variant="ghost"
            iconOnly
            icon="chevron-right"
            aria-label={t`Next week`}
            onClick={() => onWeekStartChange(addDaysToDateString(weekStart, 7))}
          />
        </div>
      </div>
      <div className="rb-mtg-cal-tools">
        <Checkbox checked={hideNonWorkingDays} onChange={setHideNonWorkingDays}>
          {t`Hide non-working days`}
        </Checkbox>
        <Select
          aria-label={t`Timezone`}
          className="rb-mtg-cal-tz"
          value={timeZone}
          options={timeZoneOptions.map((zone) => ({
            value: zone,
            label: zone.replace(/_/g, ' '),
          }))}
          onChange={onTimeZoneChange}
        />
      </div>
      {calendarNotice !== null && (
        <div className="rb-mtg-cal-notice">{calendarNotice}</div>
      )}
      <div
        className="rb-mtg-cal-days"
        style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}
      >
        <span />
        {days.map((date) => (
          <span
            key={date}
            className={cx('rb-mtg-cal-day', date === today && 'is-today')}
          >
            {dayLabel.format(toUtcDate(date))}
          </span>
        ))}
      </div>
      <div
        ref={scrollRef}
        className={cx('rb-mtg-cal-scroll', isLoading && 'is-loading')}
      >
        <div
          className="rb-mtg-cal-grid"
          style={{
            gridTemplateColumns: `56px repeat(${days.length}, 1fr)`,
            height: 24 * HOUR_HEIGHT,
          }}
          onMouseLeave={() => drag !== null && finishDrag()}
          onMouseUp={finishDrag}
        >
          <div className="rb-mtg-cal-hours">
            {Array.from({ length: 24 }, (_, hour) => (
              <span key={hour} style={{ top: hour * HOUR_HEIGHT }}>
                {minutesToTimeString(hour * 60)}
              </span>
            ))}
          </div>
          {days.map((date) => (
            <div
              key={date}
              className="rb-mtg-cal-col"
              onMouseDown={(event) => {
                const minutes = minutesAt(event.clientY, event.currentTarget);

                setDrag({ date, from: minutes, to: minutes });
              }}
              onMouseMove={(event) => {
                if (drag !== null && drag.date === date) {
                  setDrag({
                    ...drag,
                    to: minutesAt(event.clientY, event.currentTarget),
                  });
                }
              }}
            >
              {slotsOfDay(date).map((slot, index) => (
                <div
                  key={`${slot.startsAt}-${index}`}
                  className={cx(
                    'rb-mtg-cal-busy',
                    slot.title === null && 'is-busy-only',
                  )}
                  style={{
                    top: (slot.top / 60) * HOUR_HEIGHT,
                    height: (slot.height / 60) * HOUR_HEIGHT,
                  }}
                >
                  <span>{slot.title ?? t`Busy`}</span>
                  <span>
                    {toZonedTimeString(new Date(slot.startsAt), timeZone)} –{' '}
                    {toZonedTimeString(new Date(slot.endsAt), timeZone)}
                  </span>
                </div>
              ))}
              {date === selectedDate && drag === null && (
                <div
                  className="rb-mtg-cal-selected"
                  style={{
                    top: (selectionTop / 60) * HOUR_HEIGHT,
                    height: (selectionHeight / 60) * HOUR_HEIGHT,
                  }}
                >
                  {selectedStartTime} – {selectedEndTime}
                </div>
              )}
              {drag !== null && drag.date === date && (
                <div
                  className="rb-mtg-cal-selected"
                  style={{
                    top: (Math.min(drag.from, drag.to) / 60) * HOUR_HEIGHT,
                    height:
                      ((Math.abs(drag.to - drag.from) + STEP_MINUTES) / 60) *
                      HOUR_HEIGHT,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
