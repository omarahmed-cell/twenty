import { resolveRoboostTimeZone } from '@/roboost-app/meeting/utils/resolveRoboostTimeZone';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { RoboostActivityTextEditor } from '@/roboost-app/activity/components/RoboostActivityTextEditor';
import { type RoboostActivityTarget } from '@/roboost-app/activity/states/roboostActivityComposerState';
import { useRoboostWorkingDays } from '@/roboost-app/activity/hooks/useRoboostWorkingDays';
import { RoboostMeetingAssociationsPicker } from '@/roboost-app/meeting/components/RoboostMeetingAssociationsPicker';
import {
  type RoboostMeetingAttendeeDraft,
  RoboostMeetingAttendeesPicker,
} from '@/roboost-app/meeting/components/RoboostMeetingAttendeesPicker';
import {
  getWeekStart,
  RoboostMeetingWeekCalendar,
} from '@/roboost-app/meeting/components/RoboostMeetingWeekCalendar';
import {
  MEETING_HOST_CALENDAR,
  SAVE_MEETING,
} from '@/roboost-app/meeting/graphql/meetingSchedulingQueries';
import { useRoboostMeetingDefaults } from '@/roboost-app/meeting/hooks/useRoboostMeetingDefaults';
import {
  type RoboostMeetingScheduler as RoboostMeetingSchedulerRequest,
  roboostMeetingSchedulerState,
} from '@/roboost-app/meeting/states/roboostMeetingSchedulerState';
import {
  addDaysToDateString,
  addMinutesToTimeString,
  getWeekdayOfDateString,
  minutesToTimeString,
  timeStringToMinutes,
  toZonedDateString,
  toZonedTimeString,
  zonedDateTimeToIso,
} from '@/roboost-app/meeting/utils/zonedTime';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Select } from '@/roboost-ui/components/Select';
import { cx } from '@/roboost-ui/utils/cx';
import { useUserTimezone } from '@/ui/input/components/internal/date/hooks/useUserTimezone';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { isDefined, type WorkingDaysConfig } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

type RoboostLocationType = 'VIDEO_CONFERENCE' | 'ADDRESS' | 'PHONE' | 'CUSTOM';

const DEFAULT_DURATION_MINUTES = 30;
// Past this hour the pop-up offers the next working morning instead
const WORK_DAY_END_MINUTES = 18 * 60;
const COMMON_TIME_ZONES = [
  'Africa/Cairo',
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Kuwait',
  'Asia/Qatar',
  'Asia/Bahrain',
  'Asia/Muscat',
  'Europe/London',
  'UTC',
];

const memberName = (member: {
  name: { firstName: string; lastName: string };
  userEmail: string;
}) =>
  `${member.name.firstName} ${member.name.lastName}`.trim() || member.userEmail;

// The next half hour on a working day, so the pop-up never opens in the past or on a weekend
const getDefaultSlot = (timeZone: string, workingDays: WorkingDaysConfig) => {
  const now = new Date();
  let date = toZonedDateString(now, timeZone);
  let minutes =
    Math.ceil(
      (timeStringToMinutes(toZonedTimeString(now, timeZone)) + 1) / 30,
    ) * 30;

  const workDayStart = timeStringToMinutes(workingDays.startTime);

  if (minutes < workDayStart) {
    minutes = workDayStart;
  } else if (minutes >= WORK_DAY_END_MINUTES) {
    date = addDaysToDateString(date, 1);
    minutes = workDayStart;
  }
  for (
    let step = 0;
    step < 14 && !workingDays.days.includes(getWeekdayOfDateString(date));
    step++
  ) {
    date = addDaysToDateString(date, 1);
    minutes = timeStringToMinutes(workingDays.startTime);
  }
  const startTime = minutesToTimeString(minutes);

  return {
    date,
    startTime,
    endTime: addMinutesToTimeString(startTime, DEFAULT_DURATION_MINUTES),
  };
};

const RoboostMeetingSchedulerForm = ({
  request,
  onClose,
}: {
  request: RoboostMeetingSchedulerRequest;
  onClose: () => void;
}) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const apolloCoreClient = useApolloCoreClient();
  const { objectMetadataItems } = useObjectMetadataItems();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );
  const { userTimezone } = useUserTimezone();
  const { workingDays } = useRoboostWorkingDays();
  const isSchedule = request.mode === 'SCHEDULE';
  const defaults = useRoboostMeetingDefaults(request.contextTarget);

  const [size, setSize] = useState<'normal' | 'expanded' | 'minimised'>(
    'normal',
  );
  const [timeZone, setTimeZone] = useState(() =>
    resolveRoboostTimeZone(
      userTimezone,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ),
  );
  const initialSlot = getDefaultSlot(timeZone, workingDays);
  const [hostId, setHostId] = useState(currentWorkspaceMember?.id ?? '');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialSlot.date);
  const [startTime, setStartTime] = useState(initialSlot.startTime);
  const [endTime, setEndTime] = useState(initialSlot.endTime);
  const [weekStart, setWeekStart] = useState(getWeekStart(initialSlot.date));
  const [meetingType, setMeetingType] = useState('VIRTUAL');
  const [meetingOutcome, setMeetingOutcome] = useState('COMPLETED');
  const [locationType, setLocationType] =
    useState<RoboostLocationType>('VIDEO_CONFERENCE');
  const [location, setLocation] = useState('');
  const [attendeeDescription, setAttendeeDescription] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [isInternalNoteOpen, setIsInternalNoteOpen] = useState(false);
  const [attendees, setAttendees] = useState<RoboostMeetingAttendeeDraft[]>([]);
  const [targets, setTargets] = useState<RoboostActivityTarget[]>([
    request.contextTarget,
  ]);
  const [hasAppliedDefaults, setHasAppliedDefaults] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const host = currentWorkspaceMembers.find((member) => member.id === hostId);
  const hostAttendee = (memberId: string): RoboostMeetingAttendeeDraft[] => {
    const member = currentWorkspaceMembers.find(({ id }) => id === memberId);

    return isDefined(member)
      ? [
          {
            email: member.userEmail,
            displayName: memberName(member),
            workspaceMemberId: member.id,
          },
        ]
      : [];
  };

  // Defaults land once the record, its company and contact are loaded
  if (!hasAppliedDefaults && !defaults.isLoading) {
    setHasAppliedDefaults(true);
    setTitle(defaults.title);
    setAttendees([
      ...(isSchedule || defaults.attendees.length === 0
        ? hostAttendee(hostId)
        : []),
      ...defaults.attendees,
    ]);
    setTargets(defaults.targets);
  }

  const changeHost = (nextHostId: string) => {
    setAttendees((current) => [
      ...hostAttendee(nextHostId),
      ...current.filter(
        (attendee) =>
          attendee.workspaceMemberId !== hostId &&
          attendee.workspaceMemberId !== nextHostId,
      ),
    ]);
    setHostId(nextHostId);
  };

  const timeMin = zonedDateTimeToIso(weekStart, '00:00', timeZone);
  const timeMax = zonedDateTimeToIso(
    addDaysToDateString(weekStart, 7),
    '00:00',
    timeZone,
  );
  const { data: calendarData, loading: isLoadingCalendar } = useQuery<{
    meetingHostCalendar: {
      source: 'HOST_CALENDAR' | 'FREE_BUSY' | 'UNAVAILABLE';
      slots: { startsAt: string; endsAt: string; title: string | null }[];
    };
  }>(MEETING_HOST_CALENDAR, {
    variables: { hostWorkspaceMemberId: hostId, timeMin, timeMax },
    skip: !isSchedule || !isNonEmptyString(hostId),
    fetchPolicy: 'network-only',
  });
  const [saveMeeting] = useMutation<{
    saveMeeting: { meetingId: string; warning: string | null };
  }>(SAVE_MEETING);

  const hostLabel = isDefined(host) ? memberName(host) : '';
  const calendarNotice =
    calendarData?.meetingHostCalendar.source === 'UNAVAILABLE'
      ? t`Can't load ${hostLabel}'s calendar`
      : null;

  const meetingFields =
    objectMetadataItems.find((item) => item.nameSingular === 'meeting')
      ?.fields ?? [];
  const optionsOf = (fieldName: string) =>
    [
      ...(meetingFields.find((field) => field.name === fieldName)?.options ??
        []),
    ]
      .sort((first, second) => first.position - second.position)
      .map((option) => ({ value: option.value, label: option.label }));

  const locationOptions: { value: RoboostLocationType; label: string }[] = [
    { value: 'VIDEO_CONFERENCE', label: t`Google Meet` },
    { value: 'ADDRESS', label: t`In person` },
    { value: 'PHONE', label: t`Phone` },
    { value: 'CUSTOM', label: t`Custom` },
  ];

  const timeZoneOptions = [
    ...new Set([userTimezone, timeZone, ...COMMON_TIME_ZONES]),
  ];

  const changeStart = (nextStart: string) => {
    const duration =
      timeStringToMinutes(endTime) - timeStringToMinutes(startTime);

    setStartTime(nextStart);
    setEndTime(
      addMinutesToTimeString(
        nextStart,
        duration > 0 ? duration : DEFAULT_DURATION_MINUTES,
      ),
    );
  };

  const save = async () => {
    setError(null);
    if (!isNonEmptyString(title.trim())) {
      setError(t`Add a title`);
      return;
    }
    if (timeStringToMinutes(endTime) <= timeStringToMinutes(startTime)) {
      setError(t`The meeting must end after it starts`);
      return;
    }
    if (isSchedule && attendees.length === 0) {
      setError(t`Add at least one attendee`);
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await saveMeeting({
        variables: {
          input: {
            mode: request.mode,
            hostWorkspaceMemberId: hostId,
            title: title.trim(),
            startsAt: zonedDateTimeToIso(date, startTime, timeZone),
            endsAt: zonedDateTimeToIso(date, endTime, timeZone),
            timeZone,
            meetingType: meetingType || null,
            meetingOutcome: isSchedule ? null : meetingOutcome || null,
            locationType,
            location:
              locationType === 'VIDEO_CONFERENCE' ? null : location || null,
            attendeeDescription: attendeeDescription || null,
            internalNote: internalNote || null,
            attendees: attendees.map((attendee) => ({
              email: attendee.email,
              displayName: attendee.displayName,
              personId: attendee.personId ?? null,
              workspaceMemberId: attendee.workspaceMemberId ?? null,
            })),
            targets: targets.map(({ objectNameSingular, recordId }) => ({
              objectNameSingular,
              recordId,
            })),
          },
        },
      });

      enqueueToast({
        status: 'success',
        children: isSchedule ? t`Meeting scheduled` : t`Meeting logged`,
      });
      if (isNonEmptyString(data?.saveMeeting.warning)) {
        enqueueToast({
          status: 'warning',
          children: data.saveMeeting.warning,
        });
      }
      onClose();
      // The timeline reads meetings through their links, so the open record refreshes
      void apolloCoreClient.refetchQueries({ include: 'active' });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t`The meeting could not be saved`,
      );
      setIsSaving(false);
    }
  };

  const form = (
    <div className="rb-mtg-form">
      {isSchedule && (
        <div className="rb-mtg-field">
          <span className="rb-act-label">{t`Host`}</span>
          <div className="rb-mtg-radios">
            <label className="rb-mtg-radio">
              <input type="radio" checked readOnly />
              {t`User`}
            </label>
            <label className="rb-mtg-radio is-disabled" title={t`Coming soon`}>
              <input type="radio" disabled />
              {t`Meeting rotation`}
            </label>
          </div>
        </div>
      )}
      <label className="rb-mtg-field">
        {!isSchedule && <span className="rb-act-label">{t`Host`}</span>}
        <Select
          aria-label={t`Host`}
          value={hostId}
          options={currentWorkspaceMembers.map((member) => ({
            value: member.id,
            label: `${memberName(member)} <${member.userEmail}>`,
          }))}
          onChange={changeHost}
        />
        <span className="rb-mtg-hint">{t`Assigned to: ${hostLabel}`}</span>
      </label>
      <label className="rb-mtg-field">
        <span className="rb-act-label">{t`Title`} *</span>
        <Input
          value={title}
          aria-label={t`Title`}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <div className="rb-mtg-row">
        <label className="rb-mtg-field">
          <span className="rb-act-label">{t`Start date`}</span>
          <Input
            type="date"
            size="sm"
            aria-label={t`Start date`}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setWeekStart(getWeekStart(event.target.value));
            }}
          />
        </label>
        <label className="rb-mtg-field">
          <span className="rb-act-label">{t`Start time`}</span>
          <Input
            type="time"
            size="sm"
            aria-label={t`Start time`}
            value={startTime}
            onChange={(event) => changeStart(event.target.value)}
          />
        </label>
        <label className="rb-mtg-field">
          <span className="rb-act-label">{t`End time`}</span>
          <Input
            type="time"
            size="sm"
            aria-label={t`End time`}
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </label>
      </div>
      <div className="rb-mtg-row">
        <label className="rb-mtg-field">
          <span className="rb-act-label">{t`Meeting type`}</span>
          <Select
            aria-label={t`Meeting type`}
            value={meetingType}
            options={optionsOf('meetingType')}
            onChange={setMeetingType}
          />
        </label>
        {!isSchedule && (
          <label className="rb-mtg-field">
            <span className="rb-act-label">{t`Outcome`}</span>
            <Select
              aria-label={t`Outcome`}
              value={meetingOutcome}
              options={optionsOf('meetingOutcome')}
              onChange={setMeetingOutcome}
            />
          </label>
        )}
      </div>
      <div className="rb-mtg-field">
        <span className="rb-act-label">{t`Attendees`}</span>
        <RoboostMeetingAttendeesPicker
          attendees={attendees}
          onChange={setAttendees}
          allowGuests={isSchedule}
        />
      </div>
      <div className="rb-mtg-row">
        <label className="rb-mtg-field rb-mtg-field-narrow">
          <span className="rb-act-label">{t`Location`}</span>
          <Select
            aria-label={t`Location type`}
            value={locationType}
            options={locationOptions}
            onChange={(value) => setLocationType(value as RoboostLocationType)}
          />
        </label>
        <label className="rb-mtg-field">
          <span className="rb-act-label">{t`Details`}</span>
          {locationType === 'VIDEO_CONFERENCE' ? (
            <span className="rb-mtg-hint">
              {isSchedule
                ? t`A unique link will be automatically added to the invite`
                : t`Google Meet`}
            </span>
          ) : (
            <Input
              value={location}
              placeholder={
                locationType === 'PHONE'
                  ? t`Phone number`
                  : locationType === 'ADDRESS'
                    ? t`Address`
                    : t`Add custom location`
              }
              aria-label={t`Location details`}
              onChange={(event) => setLocation(event.target.value)}
            />
          )}
        </label>
      </div>
      {isSchedule && (
        <div className="rb-mtg-field">
          <span className="rb-act-label">{t`Attendee description`}</span>
          <RoboostActivityTextEditor
            value={attendeeDescription}
            placeholder={t`Send a description to your attendees…`}
            onChange={setAttendeeDescription}
          />
        </div>
      )}
      <div className="rb-mtg-assoc-line">
        <RoboostMeetingAssociationsPicker
          targets={targets}
          onChange={setTargets}
        />
      </div>
      {isInternalNoteOpen ? (
        <div className="rb-mtg-field">
          <span className="rb-act-label">{t`Internal note`}</span>
          <RoboostActivityTextEditor
            value={internalNote}
            placeholder={t`Only visible in the CRM, never sent to Google`}
            onChange={setInternalNote}
          />
        </div>
      ) : (
        <button
          type="button"
          className="rb-link rb-mtg-add-note"
          onClick={() => setIsInternalNoteOpen(true)}
        >
          <Icon name="plus" size={14} />
          {t`Add internal note`}
        </button>
      )}
      {isNonEmptyString(error) && <div className="rb-rc-error">{error}</div>}
    </div>
  );

  return (
    <div
      className={cx('rb-mtg-pop', `is-${size}`, !isSchedule && 'is-log')}
      role="dialog"
      aria-label={isSchedule ? t`Schedule` : t`Log meeting`}
    >
      <div className="rb-act-head">
        <button
          type="button"
          className="rb-rc-iconbtn"
          aria-label={size === 'minimised' ? t`Restore` : t`Minimise`}
          onClick={() => setSize(size === 'minimised' ? 'normal' : 'minimised')}
        >
          <Icon
            name={size === 'minimised' ? 'chevron-up' : 'caret'}
            size={16}
          />
        </button>
        <span className="rb-act-title">
          {isSchedule ? t`Schedule` : t`Log meeting`}
        </span>
        <span className="rb-sp" />
        <button
          type="button"
          className="rb-rc-iconbtn"
          aria-label={size === 'expanded' ? t`Shrink` : t`Expand`}
          onClick={() => setSize(size === 'expanded' ? 'normal' : 'expanded')}
        >
          <Icon
            name={size === 'expanded' ? 'minimize' : 'maximize'}
            size={15}
          />
        </button>
        <button
          type="button"
          className="rb-rc-iconbtn"
          aria-label={t`Close`}
          onClick={onClose}
        >
          <Icon name="x" size={16} />
        </button>
      </div>
      {size !== 'minimised' && (
        <>
          <div className="rb-mtg-main">
            <div className="rb-mtg-left">{form}</div>
            {isSchedule && (
              <div className="rb-mtg-right">
                <RoboostMeetingWeekCalendar
                  weekStart={weekStart}
                  onWeekStartChange={setWeekStart}
                  timeZone={timeZone}
                  timeZoneOptions={timeZoneOptions}
                  onTimeZoneChange={setTimeZone}
                  workingDays={workingDays}
                  slots={calendarData?.meetingHostCalendar.slots ?? []}
                  calendarNotice={calendarNotice}
                  isLoading={isLoadingCalendar}
                  selectedDate={date}
                  selectedStartTime={startTime}
                  selectedEndTime={endTime}
                  onSelect={(selection) => {
                    setDate(selection.date);
                    setStartTime(selection.startTime);
                    setEndTime(selection.endTime);
                  }}
                />
              </div>
            )}
          </div>
          <div className="rb-act-foot">
            <Button variant="primary" disabled={isSaving} onClick={save}>
              {isSaving
                ? t`Saving…`
                : isSchedule
                  ? t`Schedule meeting`
                  : t`Log meeting`}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              {t`Cancel`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// One meeting pop-up at a time, opened from a record's Meeting button
export const RoboostMeetingScheduler = () => {
  const [roboostMeetingScheduler, setRoboostMeetingScheduler] = useAtomState(
    roboostMeetingSchedulerState,
  );

  if (roboostMeetingScheduler === null) {
    return null;
  }

  return createPortal(
    <div className="rb-ui rb-act-layer rb-mtg-layer">
      <RoboostMeetingSchedulerForm
        key={`${roboostMeetingScheduler.mode}-${roboostMeetingScheduler.contextTarget.recordId}`}
        request={roboostMeetingScheduler}
        onClose={() => setRoboostMeetingScheduler(null)}
      />
    </div>,
    document.body,
  );
};
