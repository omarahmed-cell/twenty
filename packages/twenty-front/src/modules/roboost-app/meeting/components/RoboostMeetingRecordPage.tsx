import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { RoboostActivityTextEditor } from '@/roboost-app/activity/components/RoboostActivityTextEditor';
import { RoboostMeetingTranscript } from '@/roboost-app/meeting/components/RoboostMeetingTranscript';
import { CANCEL_MEETING_IN_GOOGLE } from '@/roboost-app/meeting/graphql/meetingSchedulingQueries';
import { RoboostRecentRecordEffect } from '@/roboost-app/search/components/RoboostRecentRecordEffect';
import { RoboostActivityAssociations } from '@/roboost-app/timeline/components/RoboostActivityAssociations';
import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { Modal } from '@/roboost-ui/components/Modal';
import { Select } from '@/roboost-ui/components/Select';
import { cx } from '@/roboost-ui/utils/cx';
import { useUserTimezone } from '@/ui/input/components/internal/date/hooks/useUserTimezone';
import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type RecordGqlFields } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { openUrlInNewTab } from '~/utils/openUrlInNewTab';

type MemberName = { firstName?: string | null; lastName?: string | null };
type NamedRecord = { id: string; name?: unknown } | null;
type LinkValue = { primaryLinkUrl?: string | null } | null;
type RichText = { markdown?: string | null } | null;

type MeetingTargetRecord = {
  id: string;
  targetCompany: NamedRecord;
  targetPerson: NamedRecord;
  targetOpportunity: NamedRecord;
  targetService: NamedRecord;
};

type MeetingPageRecord = {
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
  source: string | null;
  googleEventId: string | null;
  meetLink: LinkValue;
  recordingUrl: LinkValue;
  geminiNotesUrl: LinkValue;
  transcriptDocUrl: LinkValue;
  transcript: string | null;
  transcriptStatus: string | null;
  internalNote: RichText;
  aiSummary: RichText;
  host: { id: string; name?: MemberName | null } | null;
  assignedTo: { id: string; name?: MemberName | null } | null;
  meetingTargets: MeetingTargetRecord[] | null;
};

const NAMED: RecordGqlFields = { id: true, name: true };

const MEETING_PAGE_GQL_FIELDS: RecordGqlFields = {
  id: true,
  title: true,
  startsAt: true,
  endsAt: true,
  timezone: true,
  meetingType: true,
  meetingOutcome: true,
  locationType: true,
  location: true,
  source: true,
  googleEventId: true,
  meetLink: true,
  recordingUrl: true,
  geminiNotesUrl: true,
  transcriptDocUrl: true,
  transcript: true,
  transcriptStatus: true,
  internalNote: true,
  aiSummary: true,
  host: NAMED,
  assignedTo: NAMED,
  meetingTargets: {
    id: true,
    targetCompany: NAMED,
    targetPerson: NAMED,
    targetOpportunity: NAMED,
    targetService: NAMED,
  },
};

const TARGET_GROUPS = [
  { field: 'targetCompany', objectNameSingular: 'company' },
  { field: 'targetPerson', objectNameSingular: 'person' },
  { field: 'targetOpportunity', objectNameSingular: 'opportunity' },
  { field: 'targetService', objectNameSingular: 'service' },
] as const;

const memberName = (name: MemberName | null | undefined) =>
  [name?.firstName, name?.lastName].filter(isNonEmptyString).join(' ');

const recordName = (record: NamedRecord) => {
  const name = record?.name;

  if (typeof name === 'string') {
    return name;
  }

  return memberName(name as MemberName | null);
};

const linkUrl = (link: LinkValue) =>
  isNonEmptyString(link?.primaryLinkUrl) ? link.primaryLinkUrl : null;

type RoboostMeetingRecordPageProps = {
  recordId: string;
};

// HubSpot's meeting page: key facts on top, associations on the left, notes, recording and transcript on the right
export const RoboostMeetingRecordPage = ({
  recordId,
}: RoboostMeetingRecordPageProps) => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { userTimezone } = useUserTimezone();
  const { objectMetadataItems } = useObjectMetadataItems();
  const { updateOneRecord } = useUpdateOneRecord();
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: 'meeting',
  });
  const [cancelMeetingInGoogle] = useMutation(CANCEL_MEETING_IN_GOOGLE);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [shouldCancelInGoogle, setShouldCancelInGoogle] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { record, refetch } = useFindOneRecord<MeetingPageRecord>({
    objectNameSingular: 'meeting',
    objectRecordId: recordId,
    recordGqlFields: MEETING_PAGE_GQL_FIELDS,
  });

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
  const labelOf = (fieldName: string, value: string | null) =>
    optionsOf(fieldName).find((option) => option.value === value)?.label ??
    null;
  const objectLabel = (objectNameSingular: string) =>
    objectMetadataItems.find((item) => item.nameSingular === objectNameSingular)
      ?.labelPlural ?? objectNameSingular;

  if (!isDefined(record)) {
    return (
      <div className="rb-mtgp">
        <div className="rb-actx-loading">{t`Loading…`}</div>
      </div>
    );
  }

  const timeZone = record.timezone ?? userTimezone;
  const startsAt = isDefined(record.startsAt)
    ? new Date(record.startsAt)
    : null;
  const endsAt = isDefined(record.endsAt) ? new Date(record.endsAt) : null;
  const dateText = isDefined(startsAt)
    ? new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone,
      }).format(startsAt)
    : '';
  const timeFormat = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
  const zoneName = !isDefined(startsAt)
    ? ''
    : (new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'shortOffset',
      })
        .formatToParts(startsAt)
        .find((part) => part.type === 'timeZoneName')?.value ?? '');
  const whenText = isDefined(startsAt)
    ? `${dateText} ${t`at`} ${timeFormat.format(startsAt)}${isDefined(endsAt) ? ` – ${timeFormat.format(endsAt)}` : ''} ${zoneName}`
    : t`No date`;
  const meetUrl = linkUrl(record.meetLink);
  const isUpcoming =
    isDefined(endsAt) &&
    endsAt.getTime() > Date.now() &&
    record.meetingOutcome !== 'CANCELED';
  const hostName = memberName(record.host?.name);
  const assignedName = memberName(record.assignedTo?.name);
  const locationText =
    record.locationType === 'VIDEO_CONFERENCE'
      ? labelOf('locationType', record.locationType)
      : record.location || labelOf('locationType', record.locationType);
  const internalNote = record.internalNote?.markdown ?? '';
  const aiSummary = record.aiSummary?.markdown ?? '';
  const recordingUrl = linkUrl(record.recordingUrl);
  const geminiNotesUrl = linkUrl(record.geminiNotesUrl);
  const transcriptDocUrl = linkUrl(record.transcriptDocUrl);
  const transcript = record.transcript ?? '';

  const save = async (input: Record<string, unknown>) => {
    setError(null);
    try {
      await updateOneRecord({
        objectNameSingular: 'meeting',
        idToUpdate: recordId,
        updateOneRecordInput: input,
      });
      void refetch();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t`Could not save`,
      );
    }
  };

  const artifactEmptyText = (artifact: string) => {
    switch (record.transcriptStatus) {
      case 'WAITING':
        return t`Waiting for Google Meet. The ${artifact} appears here once the meeting has ended and Google has processed it.`;
      case 'NOT_RECORDED':
        return t`This meeting wasn't recorded, so there is no ${artifact}.`;
      case 'NOT_AVAILABLE':
        return t`The ${artifact} isn't available. It may not be shared with the CRM.`;
      default:
        return t`No ${artifact} yet.`;
    }
  };

  const confirmDelete = async () => {
    try {
      if (isNonEmptyString(record.googleEventId) && shouldCancelInGoogle) {
        await cancelMeetingInGoogle({ variables: { meetingId: recordId } });
      }
      await deleteOneRecord(recordId);
      navigate('/objects/meetings');
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t`Could not delete the meeting`,
      );
      setIsDeleteOpen(false);
    }
  };

  const groups = TARGET_GROUPS.map((group) => ({
    ...group,
    records: (record.meetingTargets ?? [])
      .map((target) => target[group.field])
      .filter(isDefined),
  })).filter((group) => group.records.length > 0);

  return (
    <div className="rb-mtgp">
      <RoboostRecentRecordEffect
        objectNameSingular="meeting"
        recordId={recordId}
        label={record.title ?? ''}
      />
      <section className="rb-mtgp-top">
        <div className="rb-mtgp-top-row">
          <Link className="rb-mtgp-back" to="/objects/meetings">
            <Icon name="chevron-left" size={14} />
            {t`Meetings`}
          </Link>
          <span className="rb-sp" />
          {isUpcoming && isNonEmptyString(meetUrl) && (
            <Button
              size="sm"
              variant="primary"
              icon="external-link"
              onClick={() => openUrlInNewTab(meetUrl)}
            >
              {t`Join Google Meet`}
            </Button>
          )}
          <Menu
            align="right"
            minWidth={200}
            entries={[
              {
                id: 'delete',
                label: t`Delete`,
                icon: 'trash',
                isDanger: true,
                onSelect: () => setIsDeleteOpen(true),
              },
            ]}
            trigger={({ toggle, isOpen }) => (
              <Button
                size="sm"
                variant="secondary"
                aria-expanded={isOpen}
                onClick={toggle}
              >
                {t`Actions`}
                <Icon name="caret" size={12} />
              </Button>
            )}
          />
        </div>
        {titleDraft === null ? (
          <h1 className="rb-mtgp-title">
            <span>{record.title || t`Untitled meeting`}</span>
            <button
              type="button"
              className="rb-rc-iconbtn"
              aria-label={t`Edit title`}
              onClick={() => setTitleDraft(record.title ?? '')}
            >
              <Icon name="pencil" size={16} />
            </button>
          </h1>
        ) : (
          <div className="rb-mtgp-title-edit">
            <Input
              value={titleDraft}
              aria-label={t`Title`}
              onChange={(event) => setTitleDraft(event.target.value)}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTitleDraft(null)}
            >
              {t`Cancel`}
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!isNonEmptyString(titleDraft.trim())}
              onClick={async () => {
                const title = titleDraft.trim();

                setTitleDraft(null);
                await save({ title });
              }}
            >
              {t`Save`}
            </Button>
          </div>
        )}
        <div className="rb-mtgp-keyline">
          <span className="rb-mtgp-when">{whenText}</span>
          {isNonEmptyString(locationText) && (
            <>
              <span className="rb-mtgp-dot">•</span>
              {record.locationType === 'VIDEO_CONFERENCE' &&
              isNonEmptyString(meetUrl) ? (
                <a href={meetUrl} target="_blank" rel="noreferrer">
                  {locationText}
                </a>
              ) : (
                <span>{locationText}</span>
              )}
            </>
          )}
        </div>
        <div className="rb-mtgp-facts">
          <span className="rb-mtgp-fact">
            <span className="rb-mtgp-fact-label">{t`Host`}</span>
            {hostName || '--'}
          </span>
          <span className="rb-mtgp-fact">
            <span className="rb-mtgp-fact-label">{t`Assigned to`}</span>
            {assignedName || '--'}
          </span>
          <label className="rb-mtgp-fact">
            <span className="rb-mtgp-fact-label">{t`Type`}</span>
            <Select
              aria-label={t`Meeting type`}
              className="rb-mtgp-select"
              value={record.meetingType ?? ''}
              options={optionsOf('meetingType')}
              onChange={(value) => save({ meetingType: value || null })}
            />
          </label>
          <label
            className={cx(
              'rb-mtgp-fact rb-mtgp-outcome',
              isNonEmptyString(record.meetingOutcome) &&
                `is-${record.meetingOutcome.toLowerCase()}`,
            )}
          >
            <span className="rb-mtgp-fact-label">{t`Outcome`}</span>
            <Select
              aria-label={t`Meeting outcome`}
              className="rb-mtgp-select"
              value={record.meetingOutcome ?? ''}
              options={optionsOf('meetingOutcome')}
              onChange={(value) => save({ meetingOutcome: value || null })}
            />
          </label>
          <span className="rb-mtgp-fact">
            <span className="rb-mtgp-fact-label">{t`Source`}</span>
            {labelOf('source', record.source) ?? '--'}
          </span>
        </div>
        {error !== null && <div className="rb-field-error">{error}</div>}
      </section>
      <div className="rb-mtgp-columns">
        <aside className="rb-mtgp-left">
          <div className="rb-mtgp-left-head">
            <span className="rb-mtgp-card-title">{t`Associations`}</span>
            <span className="rb-sp" />
            <RoboostActivityAssociations
              objectNameSingular="meeting"
              recordId={recordId}
              canEdit
            />
          </div>
          {groups.length === 0 && (
            <div className="rb-mtgp-card rb-mtgp-empty">
              {t`Not associated with any records yet.`}
            </div>
          )}
          {groups.map((group) => (
            <section key={group.field} className="rb-mtgp-card">
              <div className="rb-mtgp-card-head">
                <span className="rb-mtgp-card-title">
                  {objectLabel(group.objectNameSingular)}
                </span>
                <span className="rb-rc-count">{group.records.length}</span>
              </div>
              <ul className="rb-mtgp-assoc-list">
                {group.records.map((target) => (
                  <li key={target?.id}>
                    <Link
                      className="rb-link"
                      to={`/object/${group.objectNameSingular}/${target?.id}`}
                    >
                      {recordName(target) || t`Untitled`}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </aside>
        <div className="rb-mtgp-right">
          <section className="rb-mtgp-card">
            <div className="rb-mtgp-card-head">
              <span className="rb-mtgp-card-title">{t`Internal note`}</span>
              <span className="rb-sp" />
              {noteDraft === null && (
                <button
                  type="button"
                  className="rb-rc-iconbtn"
                  aria-label={t`Edit internal note`}
                  onClick={() => setNoteDraft(internalNote)}
                >
                  <Icon name="pencil" size={14} />
                </button>
              )}
            </div>
            {noteDraft === null ? (
              <div
                className="rb-actx-body is-editable rb-mtgp-note"
                role="button"
                tabIndex={0}
                onClick={() => setNoteDraft(internalNote)}
              >
                {internalNote.trim() === '' ? (
                  <span className="rb-muted">
                    {t`Add a note only your team can see…`}
                  </span>
                ) : (
                  internalNote
                )}
              </div>
            ) : (
              <div className="rb-mtgp-note-edit">
                <RoboostActivityTextEditor
                  value={noteDraft}
                  placeholder={t`Only visible in the CRM, never sent to Google`}
                  onChange={setNoteDraft}
                  autoFocus
                />
                <div className="rb-actx-save">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setNoteDraft(null)}
                  >
                    {t`Cancel`}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      const markdown = noteDraft;

                      setNoteDraft(null);
                      await save({
                        internalNote: { markdown, blocknote: null },
                      });
                    }}
                  >
                    {t`Save`}
                  </Button>
                </div>
              </div>
            )}
          </section>
          <section className="rb-mtgp-card">
            <div className="rb-mtgp-card-head">
              <span className="rb-mtgp-card-title">{t`Recording`}</span>
              <span className="rb-sp" />
              {isNonEmptyString(recordingUrl) && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon="external-link"
                  onClick={() => openUrlInNewTab(recordingUrl)}
                >
                  {t`Play recording`}
                </Button>
              )}
            </div>
            {!isNonEmptyString(recordingUrl) && (
              <div className="rb-mtgp-empty">
                {artifactEmptyText(t`recording`)}
              </div>
            )}
          </section>
          <section className="rb-mtgp-card">
            <div className="rb-mtgp-card-head">
              <span className="rb-mtgp-card-title">
                {isNonEmptyString(geminiNotesUrl) ||
                !isNonEmptyString(aiSummary)
                  ? t`Gemini notes`
                  : t`AI summary (HubSpot)`}
              </span>
              <span className="rb-sp" />
              {isNonEmptyString(geminiNotesUrl) && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon="external-link"
                  onClick={() => openUrlInNewTab(geminiNotesUrl)}
                >
                  {t`Open notes`}
                </Button>
              )}
            </div>
            {isNonEmptyString(aiSummary) ? (
              <div className="rb-actx-body rb-mtgp-note">{aiSummary}</div>
            ) : (
              !isNonEmptyString(geminiNotesUrl) && (
                <div className="rb-mtgp-empty">
                  {artifactEmptyText(t`Gemini notes`)}
                </div>
              )
            )}
          </section>
          <section className="rb-mtgp-card">
            <div className="rb-mtgp-card-head">
              <span className="rb-mtgp-card-title">{t`Transcript`}</span>
              <span className="rb-sp" />
              {isNonEmptyString(transcriptDocUrl) && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon="external-link"
                  onClick={() => openUrlInNewTab(transcriptDocUrl)}
                >
                  {t`Open in Google Docs`}
                </Button>
              )}
            </div>
            {transcript.trim() === '' ? (
              <div className="rb-mtgp-empty">
                {artifactEmptyText(t`transcript`)}
              </div>
            ) : (
              <RoboostMeetingTranscript transcript={transcript} />
            )}
          </section>
        </div>
      </div>
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
        {isNonEmptyString(record.googleEventId) && (
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
