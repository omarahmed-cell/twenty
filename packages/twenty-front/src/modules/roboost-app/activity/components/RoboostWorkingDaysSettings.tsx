import { useRoboostWorkingDays } from '@/roboost-app/activity/hooks/useRoboostWorkingDays';
import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Input } from '@/roboost-ui/components/Input';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { type WorkingDaysConfig } from 'twenty-shared/utils';

const WEEK_DAYS_FROM_SUNDAY = [0, 1, 2, 3, 4, 5, 6];

// Used by task due dates now, and by sequences, workflows and reminders later
export const RoboostWorkingDaysSettings = () => {
  const { t } = useLingui();
  const { workingDays, saveWorkingDays } = useRoboostWorkingDays();
  const [draft, setDraft] = useState<WorkingDaysConfig>(workingDays);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const dayNameFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
  // 4 Jan 2026 is a Sunday, so adding the week day index gives that day's name
  const dayName = (weekDay: number) =>
    dayNameFormat.format(new Date(2026, 0, 4 + weekDay));
  const isChanged = JSON.stringify(draft) !== JSON.stringify(workingDays);

  const save = async () => {
    setStatus('saving');
    try {
      await saveWorkingDays({
        days: [...draft.days].sort((first, second) => first - second),
        startTime: draft.startTime,
      });
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="rb-ui rb-workdays">
      <div
        className="rb-workdays-days"
        role="group"
        aria-label={t`Working days`}
      >
        {WEEK_DAYS_FROM_SUNDAY.map((weekDay) => (
          <Checkbox
            key={weekDay}
            checked={draft.days.includes(weekDay)}
            onChange={(checked) => {
              setStatus('idle');
              setDraft({
                ...draft,
                days: checked
                  ? [...draft.days, weekDay]
                  : draft.days.filter((day) => day !== weekDay),
              });
            }}
          >
            {dayName(weekDay)}
          </Checkbox>
        ))}
      </div>
      <label className="rb-workdays-start">
        <span>{t`Work day starts at`}</span>
        <Input
          type="time"
          size="sm"
          aria-label={t`Work day starts at`}
          value={draft.startTime}
          onChange={(event) => {
            setStatus('idle');
            setDraft({ ...draft, startTime: event.target.value });
          }}
        />
      </label>
      <div className="rb-workdays-foot">
        <Button
          variant="primary"
          size="sm"
          disabled={
            !isChanged || draft.days.length === 0 || status === 'saving'
          }
          onClick={save}
        >
          {status === 'saving' ? t`Saving…` : t`Save`}
        </Button>
        {status === 'saved' && (
          <span className="rb-workdays-note">{t`Saved`}</span>
        )}
        {status === 'error' && (
          <span className="rb-workdays-note is-error">
            {t`Only admins can change the working days.`}
          </span>
        )}
      </div>
    </div>
  );
};
