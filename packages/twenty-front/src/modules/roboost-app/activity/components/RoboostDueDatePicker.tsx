import {
  getRoboostDueDate,
  ROBOOST_DUE_DATE_OPTIONS,
  type RoboostDueDateOption,
} from '@/roboost-app/activity/utils/getRoboostDueDate';
import { Input } from '@/roboost-ui/components/Input';
import { Select } from '@/roboost-ui/components/Select';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type WorkingDaysConfig } from 'twenty-shared/utils';

export type RoboostDueDateValue = {
  option: RoboostDueDateOption;
  customDate: string;
  time: string;
};

type RoboostDueDatePickerProps = {
  value: RoboostDueDateValue;
  onChange: (value: RoboostDueDateValue) => void;
  workingDays: WorkingDaysConfig;
  showTime?: boolean;
  className?: string;
};

export const toRoboostDueDate = (
  value: RoboostDueDateValue,
  workingDays: WorkingDaysConfig,
  now = new Date(),
) =>
  getRoboostDueDate({
    option: value.option,
    now,
    time: value.time,
    customDate: value.customDate,
    config: workingDays,
  });

// HubSpot-style quick picks; the date each one lands on is shown next to it
export const RoboostDueDatePicker = ({
  value,
  onChange,
  workingDays,
  showTime = true,
  className,
}: RoboostDueDatePickerProps) => {
  const { t } = useLingui();
  const now = new Date();
  const shortDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const labelByOption: Record<RoboostDueDateOption, string> = {
    today: t`Today`,
    tomorrow: t`Tomorrow`,
    businessDays2: t`In 2 business days`,
    businessDays3: t`In 3 business days`,
    week1: t`In 1 week`,
    weeks2: t`In 2 weeks`,
    month1: t`In 1 month`,
    months3: t`In 3 months`,
    custom: t`Custom date`,
  };

  return (
    <div className={cx('rb-due', className)}>
      <Select
        aria-label={t`Due date`}
        className="rb-due-option"
        value={value.option}
        options={ROBOOST_DUE_DATE_OPTIONS.map((option) => ({
          value: option,
          label:
            option === 'custom'
              ? labelByOption[option]
              : `${labelByOption[option]} (${shortDate.format(
                  getRoboostDueDate({
                    option,
                    now,
                    time: value.time,
                    config: workingDays,
                  }),
                )})`,
        }))}
        onChange={(option) =>
          onChange({ ...value, option: option as RoboostDueDateOption })
        }
      />
      {value.option === 'custom' && (
        <Input
          type="date"
          size="sm"
          aria-label={t`Custom due date`}
          value={value.customDate}
          onChange={(event) =>
            onChange({ ...value, customDate: event.target.value })
          }
        />
      )}
      {showTime && (
        <Input
          type="time"
          size="sm"
          className="rb-due-time"
          aria-label={t`Due time`}
          value={value.time}
          onChange={(event) => onChange({ ...value, time: event.target.value })}
        />
      )}
    </div>
  );
};
