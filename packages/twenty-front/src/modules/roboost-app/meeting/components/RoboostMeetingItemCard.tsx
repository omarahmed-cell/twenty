import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { roboostFieldHistoryState } from '@/roboost-app/history/states/roboostFieldHistoryState';
import { RoboostActivityTextEditor } from '@/roboost-app/activity/components/RoboostActivityTextEditor';
import {
  type RoboostMeetingAttendeeDraft,
  RoboostMeetingAttendeesPicker,
} from '@/roboost-app/meeting/components/RoboostMeetingAttendeesPicker';
import { CANCEL_MEETING_IN_GOOGLE } from '@/roboost-app/meeting/graphql/meetingSchedulingQueries';
import {
  toZonedDateString,
  toZonedTimeString,
  zonedDateTimeToIso,
  timeStringToMinutes,
} from '@/roboost-app/meeting/utils/zonedTime';
import { RoboostActivityAssociations } from '@/roboost-app/timeline/components/RoboostActivityAssociations';
import { useRoboostCanEditActivity } from '@/roboost-app/timeline/hooks/useRoboostCanEditActivity';
import { roboostPropertiesPanelState } from '@/roboost-app/timeline/states/roboostPropertiesPanelState';
import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { Modal } from '@/roboost-ui/components/Modal';
import { Popover } from '@/roboost-ui/components/Popover';
import { Select } from '@/roboost-ui/components/Select';
import { cx } from '@/roboost-ui/utils/cx';
import { useUserTimezone } from '@/ui/input/components/internal/date/hooks/useUserTimezone';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { type RecordGqlFields } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

type MemberName = { firstName?: string | null; lastName?: string | null };

type MeetingAttendeeRecord = {
  id: string;
  email: string | null;
  displayName: string | null;
  responseStatus: string | null;
  isOrganizer: boolean | null;
  personId: string | null;
  workspaceMemberId: string | null;
};

type MeetingRecord = {
  __typename: string;
  id: string;
  title: string | null;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string | null;
  meetingType: string | null;
  meetingOutcome: string | null;
  locationType: string | null;
  location: string | null;
  googleEventId: string | null;
  attendeeDescription: { markdown?: string | null } | null;
  host: { id: string; name?: MemberName | null } | null;
  meetingAttendees: MeetingAttendeeRecord[] | null;
};

type MeetingDraft = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingType: string;
  meetingOutcome: string;
  locationType: string;
  location: string;
  attendeeDescription: string;
  attendees: RoboostMeetingAttendeeDraft[];
};

type RoboostMeetingItemCardProps = {
  recordId: string;
  time: string;
  isExpanded: boolean;
  onToggleExpanded: (isExpanded: boolean) => void;
  isPinned: boolean;
  onTogglePin: () => void;
  onChanged: () => void;
};

const MEETING_GQL_FIELDS: RecordGqlFields = {
  id: true,
  title: true,
  startsAt: true,
  endsAt: true,
  timezone: true,
  meetingType: true,
  meetingOutcome: true,
  locationType: true,
  location: true,
  googleEventId: true,
  attendeeDescription: true,
  host: { id: true, name: true },
  meetingAttendees: {
    id: true,
    email: true,
    displayName: true,
    responseStatus: true,
    isOrganizer: true,
    personId: true,
    workspaceMemberId: true,
  },
};

const memberName = (name: MemberName | null | undefined) =>
  [name?.firstName, name?.lastName].filter(isNonEmptyString).join(' ');

const joinNames = (names: string[], and: string) =>
  names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`;

// Read-only like HubSpot; Actions → Edit opens the form, and Google-visible edits reach the invite
export const RoboostMeetingItemCard = ({
  recordId,
  time,
  isExpanded,
  onToggleExpanded,
  isPinned,
  onTogglePin,
  onChanged,
}: RoboostMeetingItemCardProps) => {
  const { t } = useLingui();
  const { userTimezone } = useUserTimezone();
  const { objectMetadataItems } = useObjectMetadataItems();
  const { canEditActivity } = useRoboostCanEditActivity();
  const canEdit = canEditActivity({ objectNameSingular: 'meeting', recordId });
  const setRoboostFieldHistory = useSetAtomState(roboostFieldHistoryState);
  const setRoboostPropertiesPanel = useSetAtomState(
    roboostPropertiesPanelState,
  );
  const { updateOneRecord } = useUpdateOneRecord();
  const { createOneRecord: createAttendee } = useCreateOneRecord({
    objectNameSingular: 'meetingAttendee',
  });
  const { deleteOneRecord: deleteAttendee } = useDeleteOneRecord({
    objectNameSingular: 'meetingAttendee',
  });
  const { deleteOneRecord: deleteMeeting } = useDeleteOneRecord({
    objectNameSingular: 'meeting',
  });
  const [cancelMeetingInGoogle] = useMutation(CANCEL_MEETING_IN_GOOGLE);
  const [draft, setDraft] = useState<MeetingDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [shouldCancelInGoogle, setShouldCancelInGoogle] = useState(true);

  const { record, refetch } = useFindOneRecord<MeetingRecord>({
    objectNameSingular: 'meeting',
    objectRecordId: recordId,
    recordGqlFields: MEETING_GQL_FIELDS,
  });

  const fieldsOf = (objectNameSingular: string) =>
    objectMetadataItems.find((item) => item.nameSingular === objectNameSingular)
      ?.fields ?? [];
  const optionsOf = (objectNameSingular: string, fieldName: string) =>
    [
      ...(fieldsOf(objectNameSingular).find((field) => field.name === fieldName)
        ?.options ?? []),
    ]
      .sort((first, second) => first.position - second.position)
      .map((option) => ({ value: option.value, label: option.label }));
  const labelOf = (
    objectNameSingular: string,
    fieldName: string,
    value: string | null,
  ) =>
    optionsOf(objectNameSingular, fieldName).find(
      (option) => option.value === value,
    )?.label ?? '--';

  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );
  const attendeeName = (attendee: MeetingAttendeeRecord) =>
    attendee.displayName?.trim() ||
    memberName(
      currentWorkspaceMembers.find(
        (member) =>
          member.id === attendee.workspaceMemberId ||
          member.userEmail.toLowerCase() === attendee.email?.toLowerCase(),
      )?.name,
    ) ||
    attendee.email ||
    '';
  const timeZone = record?.timezone ?? userTimezone;
  const hostName = memberName(record?.host?.name);
  const attendees = record?.meetingAttendees ?? [];
  const organizer = attendees.find((attendee) => attendee.isOrganizer === true);
  const guestNames = attendees
    .filter((attendee) => attendee.workspaceMemberId !== record?.host?.id)
    .map(attendeeName)
    .filter(isNonEmptyString);
  const durationMinutes =
    isDefined(record?.startsAt) && isDefined(record?.endsAt)
      ? Math.round(
          (new Date(record.endsAt).getTime() -
            new Date(record.startsAt).getTime()) /
            60000,
        )
      : null;
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const hourText =
      hours === 0 ? '' : hours === 1 ? t`1 hour` : t`${hours} hours`;
    const minuteText = rest === 0 ? '' : t`${rest} minutes`;

    return [hourText, minuteText].filter(isNonEmptyString).join(' ') || '--';
  };
  const startText = isDefined(record?.startsAt)
    ? new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone,
        timeZoneName: 'shortOffset',
      }).format(new Date(record.startsAt))
    : '--';
  const attendeeDescription = record?.attendeeDescription?.markdown ?? '';

  const startEdit = () => {
    if (!isDefined(record)) {
      return;
    }
    const startsAt = new Date(record.startsAt ?? Date.now());
    const endsAt = new Date(record.endsAt ?? startsAt.getTime() + 1800000);

    setDraft({
      title: record.title ?? '',
      date: toZonedDateString(startsAt, timeZone),
      startTime: toZonedTimeString(startsAt, timeZone),
      endTime: toZonedTimeString(endsAt, timeZone),
      meetingType: record.meetingType ?? '',
      meetingOutcome: record.meetingOutcome ?? '',
      locationType: record.locationType ?? '',
      location:
        record.locationType === 'VIDEO_CONFERENCE'
          ? ''
          : (record.location ?? ''),
      attendeeDescription,
      attendees: attendees
        .filter((attendee) => isNonEmptyString(attendee.email))
        .map((attendee) => ({
          email: attendee.email as string,
          displayName: attendee.displayName,
          personId: attendee.personId,
          workspaceMemberId: attendee.workspaceMemberId,
        })),
    });
    setError(null);
    onToggleExpanded(true);
  };

  const save = async () => {
    if (!isDefined(draft) || !isDefined(record)) {
      return;
    }
    if (!isNonEmptyString(draft.title.trim())) {
      setError(t`Add a title`);
      return;
    }
    if (
      timeStringToMinutes(draft.endTime) <= timeStringToMinutes(draft.startTime)
    ) {
      setError(t`The meeting must end after it starts`);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await updateOneRecord({
        objectNameSingular: 'meeting',
        idToUpdate: recordId,
        updateOneRecordInput: {
          title: draft.title.trim(),
          startsAt: zonedDateTimeToIso(draft.date, draft.startTime, timeZone),
          endsAt: zonedDateTimeToIso(draft.date, draft.endTime, timeZone),
          meetingType: draft.meetingType || null,
          meetingOutcome: draft.meetingOutcome || null,
          locationType: draft.locationType || null,
          ...(draft.locationType === 'VIDEO_CONFERENCE'
            ? {}
            : { location: draft.location || null }),
          attendeeDescription: {
            markdown: draft.attendeeDescription,
            blocknote: null,
          },
        },
      });

      const draftEmails = draft.attendees.map(({ email }) =>
        email.toLowerCase(),
      );
      const existingEmails = attendees.map(({ email }) =>
        (email ?? '').toLowerCase(),
      );

      for (const attendee of attendees) {
        if (!draftEmails.includes((attendee.email ?? '').toLowerCase())) {
          await deleteAttendee(attendee.id);
        }
      }
      for (const [index, attendee] of draft.attendees.entries()) {
        if (!existingEmails.includes(attendee.email.toLowerCase())) {
          await createAttendee({
            meetingId: recordId,
            email: attendee.email.toLowerCase(),
            displayName: attendee.displayName,
            personId: attendee.personId ?? null,
            workspaceMemberId: attendee.workspaceMemberId ?? null,
            responseStatus: 'NEEDS_ACTION',
            position: attendees.length + index,
          });
        }
      }

      setDraft(null);
      void refetch();
      onChanged();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t`Could not save`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    setError(null);
    try {
      if (isNonEmptyString(record?.googleEventId) && shouldCancelInGoogle) {
        await cancelMeetingInGoogle({ variables: { meetingId: recordId } });
      }
      await deleteMeeting(recordId);
      setIsDeleteOpen(false);
      onChanged();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t`Could not delete the meeting`,
      );
      setIsDeleteOpen(false);
    }
  };

  const toggle = () => onToggleExpanded(!isExpanded);
  const isEditing = isDefined(draft);
  const updateDraft = (values: Partial<MeetingDraft>) =>
    isDefined(draft) && setDraft({ ...draft, ...values });

  const readView = isDefined(record) && (
    <div className="rb-actx rb-mtgc">
      <div className="rb-mtgc-owner">
        <span>{hostName}</span>
        {isDefined(organizer) && (
          <>
            <span className="rb-mtgc-divider" />
            <span>{t`Organized by ${attendeeName(organizer)}`}</span>
          </>
        )}
      </div>
      <Link
        className="rb-link rb-mtgc-details"
        to={`/object/meeting/${recordId}`}
      >
        <Icon name="calendar" size={14} />
        {t`View meeting details`}
      </Link>
      <div className="rb-mtgc-desc">
        <div className="rb-actx-label">{t`Attendee description`}</div>
        <div className="rb-actx-body">
          {attendeeDescription.trim() === '' ? (
            <span className="rb-muted">{t`No description`}</span>
          ) : (
            attendeeDescription
          )}
        </div>
      </div>
      <div className="rb-actx-fields rb-mtgc-grid">
        <div className="rb-actx-field">
          <div className="rb-actx-label">{t`Meeting type`}</div>
          <div className="rb-mtgc-value">
            {labelOf('meeting', 'meetingType', record.meetingType)}
          </div>
        </div>
        <div className="rb-actx-field">
          <div className="rb-actx-label">{t`Meeting outcome`}</div>
          <div className="rb-mtgc-value">
            {labelOf('meeting', 'meetingOutcome', record.meetingOutcome)}
          </div>
        </div>
        <div className="rb-actx-field">
          <div className="rb-actx-label">{t`Meeting start time`}</div>
          <div className="rb-mtgc-value">{startText}</div>
        </div>
        <div className="rb-actx-field">
          <div className="rb-actx-label">{t`Attendees`}</div>
          <Popover
            ariaLabel={t`Attendees`}
            trigger={({ toggle: toggleAttendees }) => (
              <button
                type="button"
                className="rb-link rb-mtgc-attendees"
                onClick={toggleAttendees}
              >
                {attendees.length === 1
                  ? t`1 attendee`
                  : t`${attendees.length} attendees`}
              </button>
            )}
          >
            {() => (
              <div className="rb-mtgc-attendee-list">
                {attendees.map((attendee) => (
                  <div key={attendee.id} className="rb-mtgc-attendee">
                    <span className="rb-truncate">
                      {attendeeName(attendee)}
                      {attendee.isOrganizer === true
                        ? ` (${t`Organizer`})`
                        : ''}
                    </span>
                    <span className="rb-mtgc-response">
                      {labelOf(
                        'meetingAttendee',
                        'responseStatus',
                        attendee.responseStatus,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Popover>
        </div>
        <div className="rb-actx-field">
          <div className="rb-actx-label">{t`Duration`}</div>
          <div className="rb-mtgc-value">
            {isDefined(durationMinutes)
              ? formatDuration(durationMinutes)
              : '--'}
          </div>
        </div>
        <div className="rb-actx-field">
          <div className="rb-actx-label">{t`Location type`}</div>
          <div className="rb-mtgc-value">
            {labelOf('meeting', 'locationType', record.locationType)}
          </div>
        </div>
        <div className="rb-actx-field">
          <div className="rb-actx-label">{t`Meeting location`}</div>
          <div
            className="rb-mtgc-value rb-truncate"
            title={record.location ?? ''}
          >
            {isNonEmptyString(record.location) ? record.location : '--'}
          </div>
        </div>
      </div>
      {error !== null && <div className="rb-field-error">{error}</div>}
      <div className="rb-actx-foot">
        {/* Comments are not built yet; the entry stays visible */}
        <button type="button" className="rb-actx-comment">
          <Icon name="note" size={14} />
          {t`Add comment`}
        </button>
        <span className="rb-sp" />
        <RoboostActivityAssociations
          objectNameSingular="meeting"
          recordId={recordId}
          canEdit={canEdit}
        />
      </div>
    </div>
  );

  const editView = isDefined(draft) && (
    <div className="rb-actx rb-mtgc rb-mtg-form">
      <label className="rb-mtg-field">
        <span className="rb-act-label">{t`Title`} *</span>
        <Input
          value={draft.title}
          aria-label={t`Title`}
          onChange={(event) => updateDraft({ title: event.target.value })}
        />
      </label>
      <div className="rb-mtg-row">
        <label className="rb-mtg-field">
          <span className="rb-act-label">{t`Start date`}</span>
          <Input
            type="date"
            size="sm"
            aria-label={t`Start date`}
            value={draft.date}
            onChange={(event) => updateDraft({ date: event.target.value })}
          />
        </label>
        <label className="rb-mtg-field">
          <span className="rb-act-label">{t`Start time`}</span>
          <Input
            type="time"
            size="sm"
            aria-label={t`Start time`}
            value={draft.startTime}
            onChange={(event) => updateDraft({ startTime: event.target.value })}
          />
        </label>
        <label className="rb-mtg-field">
          <span className="rb-act-label">{t`End time`}</span>
          <Input
            type="time"
            size="sm"
            aria-label={t`End time`}
            value={draft.endTime}
            onChange={(event) => updateDraft({ endTime: event.target.value })}
          />
        </label>
      </div>
      <div className="rb-mtg-row">
        <label className="rb-mtg-field">
          <span className="rb-act-label">{t`Meeting type`}</span>
          <Select
            aria-label={t`Meeting type`}
            value={draft.meetingType}
            options={optionsOf('meeting', 'meetingType')}
            onChange={(value) => updateDraft({ meetingType: value })}
          />
        </label>
        <label className="rb-mtg-field">
          <span className="rb-act-label">{t`Meeting outcome`}</span>
          <Select
            aria-label={t`Meeting outcome`}
            value={draft.meetingOutcome}
            options={optionsOf('meeting', 'meetingOutcome')}
            onChange={(value) => updateDraft({ meetingOutcome: value })}
          />
        </label>
      </div>
      <div className="rb-mtg-field">
        <span className="rb-act-label">{t`Attendees`}</span>
        <RoboostMeetingAttendeesPicker
          attendees={draft.attendees}
          onChange={(nextAttendees) =>
            updateDraft({ attendees: nextAttendees })
          }
          allowGuests
        />
      </div>
      <div className="rb-mtg-row">
        <label className="rb-mtg-field rb-mtg-field-narrow">
          <span className="rb-act-label">{t`Location type`}</span>
          <Select
            aria-label={t`Location type`}
            value={draft.locationType}
            options={optionsOf('meeting', 'locationType')}
            onChange={(value) => updateDraft({ locationType: value })}
          />
        </label>
        <label className="rb-mtg-field">
          <span className="rb-act-label">{t`Meeting location`}</span>
          {draft.locationType === 'VIDEO_CONFERENCE' ? (
            <span className="rb-mtg-hint">
              {isNonEmptyString(record?.location)
                ? record.location
                : t`A Google Meet link is added to the invite`}
            </span>
          ) : (
            <Input
              value={draft.location}
              aria-label={t`Meeting location`}
              onChange={(event) =>
                updateDraft({ location: event.target.value })
              }
            />
          )}
        </label>
      </div>
      <div className="rb-mtg-field">
        <span className="rb-act-label">{t`Attendee description`}</span>
        <RoboostActivityTextEditor
          value={draft.attendeeDescription}
          placeholder={t`Send a description to your attendees…`}
          onChange={(value) => updateDraft({ attendeeDescription: value })}
        />
      </div>
      {isNonEmptyString(record?.googleEventId) && (
        <span className="rb-mtg-hint">
          {t`Title, time, attendees, location and description update the Google invite and notify attendees.`}
        </span>
      )}
      {error !== null && <div className="rb-field-error">{error}</div>}
      <div className="rb-actx-save">
        <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
          {t`Cancel`}
        </Button>
        <Button size="sm" variant="primary" disabled={isSaving} onClick={save}>
          {t`Save`}
        </Button>
      </div>
    </div>
  );

  return (
    <div
      className={cx(
        'rb-actc',
        'rb-mtgc-card',
        isExpanded && 'is-open',
        isPinned && 'is-pinned',
      )}
    >
      <div className="rb-actc-head">
        <button
          type="button"
          className="rb-actc-toggle"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? t`Collapse` : t`Expand`}
          onClick={toggle}
        >
          <Icon name="caret" size={14} />
        </button>
        <span className="rb-actc-icon rb-tone-info">
          <Icon name="calendar" size={14} />
        </span>
        <div
          className="rb-actc-title"
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggle();
            }
          }}
        >
          {isPinned && <Icon name="pin" size={12} className="rb-actc-pin" />}
          <b>
            {t`Meeting`} - {record?.title ?? ''}
          </b>
          {isNonEmptyString(hostName) ? ` ${t`hosted by`} ${hostName}` : ''}
          {record?.meetingOutcome === 'CANCELED' && (
            <span className="rb-mtgc-canceled">{t`Canceled`}</span>
          )}
          {guestNames.length > 0 && (
            <div className="rb-mtgc-with">
              {t`with`} {joinNames(guestNames, t`and`)}
            </div>
          )}
        </div>
        <Menu
          align="right"
          minWidth={210}
          entries={[
            {
              id: 'edit',
              label: t`Edit`,
              icon: 'pencil',
              isDisabled: !canEdit,
              onSelect: () => canEdit && startEdit(),
            },
            {
              id: 'pin',
              label: isPinned ? t`Unpin` : t`Pin`,
              icon: 'pin',
              onSelect: onTogglePin,
            },
            {
              id: 'history',
              label: t`History`,
              icon: 'history',
              onSelect: () =>
                setRoboostFieldHistory({
                  objectNameSingular: 'meeting',
                  recordId,
                  fieldName: 'title',
                }),
            },
            {
              id: 'properties',
              label: t`View all properties`,
              icon: 'list',
              onSelect: () =>
                setRoboostPropertiesPanel({
                  objectNameSingular: 'meeting',
                  recordId,
                }),
            },
            { id: 'sep', isSeparator: true },
            {
              id: 'delete',
              label: t`Delete`,
              icon: 'trash',
              isDanger: true,
              isDisabled: !canEdit,
              onSelect: () => canEdit && setIsDeleteOpen(true),
            },
          ]}
          trigger={({ toggle: toggleMenu, isOpen }) => (
            <button
              type="button"
              className="rb-actc-actions"
              aria-expanded={isOpen}
              onClick={toggleMenu}
            >
              {t`Actions`}
              <Icon name="caret" size={12} />
            </button>
          )}
        />
        <span className="rb-actc-time">{time}</span>
      </div>
      {isExpanded &&
        (isDefined(record) ? (
          isEditing ? (
            editView
          ) : (
            readView
          )
        ) : (
          <div className="rb-actx-loading">{t`Loading…`}</div>
        ))}
      <Modal
        open={isDeleteOpen}
        tone="danger"
        title={t`Delete this meeting?`}
        subtitle={t`It moves to the trash and can be restored from there.`}
        onClose={() => setIsDeleteOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              {t`Cancel`}
            </Button>
            <Button variant="primary" tone="danger" onClick={confirmDelete}>
              {t`Delete`}
            </Button>
          </>
        }
      >
        {isNonEmptyString(record?.googleEventId) && (
          <Checkbox
            checked={shouldCancelInGoogle}
            onChange={setShouldCancelInGoogle}
          >
            {t`Also cancel it in Google Calendar and notify attendees?`}
          </Checkbox>
        )}
      </Modal>
    </div>
  );
};
