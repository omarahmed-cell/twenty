import { getEmailAddressNames } from '@/activities/unified-emails/utils/getEmailAddressNames';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useRoboostTargetedRecords } from '@/roboost-app/hooks/useRoboostTargetedRecords';
import {
  type RoboostFeedEmail,
  type RoboostFeedItem,
} from '@/roboost-app/types/RoboostFeedItem';
import {
  getRoboostPersonName,
  type RoboostFullName,
} from '@/roboost-app/utils/getRoboostPersonName';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString, isNumber, isString } from '@sniptt/guards';
import {
  CoreObjectNameSingular,
  type RecordGqlFields,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

type LooseRecord = Record<string, unknown>;

const asString = (value: unknown) => (isString(value) ? value : null);

const getMarkdown = (value: unknown) =>
  asString((value as { markdown?: unknown } | null | undefined)?.markdown) ??
  '';

const getRelatedName = (value: unknown) =>
  getRoboostPersonName(
    (value as { name?: RoboostFullName } | null | undefined)?.name,
  );

const getRelatedId = (value: unknown) =>
  asString((value as { id?: unknown } | null | undefined)?.id);

const getActorName = (value: unknown) =>
  asString((value as { name?: unknown } | null | undefined)?.name) ?? '';

const getActorId = (value: unknown) =>
  asString(
    (value as { workspaceMemberId?: unknown } | null | undefined)
      ?.workspaceMemberId,
  );

const MEMBER_FIELDS: RecordGqlFields = { id: true, name: true };

export const useRoboostActivityFeed = ({
  targetRecordId,
  targetObjectNameSingular,
}: {
  targetRecordId: string;
  targetObjectNameSingular: string;
}) => {
  const { t } = useLingui();
  const target = { targetRecordId, targetObjectNameSingular };
  const { objectMetadataItems } = useObjectMetadataItems();
  const taskStatusOptions =
    objectMetadataItems
      .find((item) => item.nameSingular === CoreObjectNameSingular.Task)
      ?.fields.find((field) => field.name === 'status')?.options ?? [];

  const getTaskStatusLabel = (status: string | null) =>
    status === null
      ? ''
      : (taskStatusOptions.find((option) => option.value === status)?.label ??
        status);

  const emails = useRoboostTargetedRecords({
    ...target,
    junctionObjectNameSingular: CoreObjectNameSingular.EmailTarget,
    relationFieldName: 'email',
    recordGqlFields: {
      id: true,
      subject: true,
      bodyPreview: true,
      bodyV2: true,
      direction: true,
      from: true,
      to: true,
      sentAt: true,
      createdAt: true,
      openCount: true,
      clickCount: true,
      lastOpenedAt: true,
      lastClickedAt: true,
      loggedBy: MEMBER_FIELDS,
    },
  });

  const notes = useRoboostTargetedRecords({
    ...target,
    junctionObjectNameSingular: CoreObjectNameSingular.NoteTarget,
    relationFieldName: 'note',
    recordGqlFields: {
      id: true,
      title: true,
      bodyV2: true,
      createdAt: true,
      createdBy: true,
    },
  });

  const tasks = useRoboostTargetedRecords({
    ...target,
    junctionObjectNameSingular: CoreObjectNameSingular.TaskTarget,
    relationFieldName: 'task',
    recordGqlFields: {
      id: true,
      title: true,
      bodyV2: true,
      status: true,
      dueAt: true,
      createdAt: true,
      createdBy: true,
      assignee: MEMBER_FIELDS,
    },
  });

  const calls = useRoboostTargetedRecords({
    ...target,
    junctionObjectNameSingular: CoreObjectNameSingular.CallTarget,
    relationFieldName: 'call',
    recordGqlFields: {
      id: true,
      title: true,
      bodyV2: true,
      direction: true,
      outcome: true,
      createdAt: true,
      createdBy: true,
    },
  });

  const meetings = useRoboostTargetedRecords({
    ...target,
    junctionObjectNameSingular: CoreObjectNameSingular.CalendarEventTarget,
    relationFieldName: 'calendarEvent',
    recordGqlFields: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      location: true,
      isCanceled: true,
      createdAt: true,
    },
  });

  const items: RoboostFeedItem[] = [];

  for (const record of emails.records as LooseRecord[]) {
    const email: RoboostFeedEmail = {
      id: String(record.id),
      subject: asString(record.subject),
      bodyPreview: asString(record.bodyPreview),
      bodyMarkdown: getMarkdown(record.bodyV2),
      direction: asString(record.direction),
      from: asString(record.from),
      to: asString(record.to),
      sentAt: asString(record.sentAt) ?? asString(record.createdAt),
      openCount: isNumber(record.openCount) ? record.openCount : 0,
      clickCount: isNumber(record.clickCount) ? record.clickCount : 0,
      lastOpenedAt: asString(record.lastOpenedAt),
      lastClickedAt: asString(record.lastClickedAt),
      loggedByName: getRelatedName(record.loggedBy),
      loggedById: getRelatedId(record.loggedBy),
    };
    const subject = isNonEmptyString(email.subject)
      ? email.subject
      : t`(no subject)`;

    items.push({
      id: `email-${email.id}`,
      kind: 'email',
      date: email.sentAt ?? '',
      title: subject,
      body: `${email.bodyPreview ?? ''} ${email.bodyMarkdown ?? ''}`,
      ownerId: email.loggedById,
      ownerName: email.loggedByName,
      creatorId: email.loggedById,
      meta: '',
      email,
    });

    if (email.openCount > 0 || email.clickCount > 0) {
      const recipient = getEmailAddressNames(email.to)[0] ?? t`Recipient`;
      const openCount = email.openCount;
      const clickCount = email.clickCount;
      const details = [
        openCount === 1
          ? t`opened once`
          : openCount > 1
            ? t`opened ${openCount} times`
            : '',
        clickCount === 1
          ? t`clicked once`
          : clickCount > 1
            ? t`clicked ${clickCount} times`
            : '',
      ].filter(isNonEmptyString);

      items.push({
        id: `tracking-${email.id}`,
        kind: 'tracking',
        date: email.lastClickedAt ?? email.lastOpenedAt ?? email.sentAt ?? '',
        title: recipient,
        body: subject,
        ownerId: email.loggedById,
        ownerName: email.loggedByName,
        creatorId: email.loggedById,
        meta: `${t`Email tracking`} · ${details.join(', ')}`,
        email,
      });
    }
  }

  for (const record of notes.records as LooseRecord[]) {
    items.push({
      id: `note-${String(record.id)}`,
      kind: 'note',
      date: asString(record.createdAt) ?? '',
      title: asString(record.title) ?? '',
      body: getMarkdown(record.bodyV2),
      ownerId: getActorId(record.createdBy),
      ownerName: getActorName(record.createdBy),
      creatorId: getActorId(record.createdBy),
      meta: '',
    });
  }

  for (const record of tasks.records as LooseRecord[]) {
    const assigneeName = getRelatedName(record.assignee);

    items.push({
      id: `task-${String(record.id)}`,
      kind: 'task',
      date: asString(record.dueAt) ?? asString(record.createdAt) ?? '',
      title: asString(record.title) ?? '',
      body: getMarkdown(record.bodyV2),
      ownerId: getRelatedId(record.assignee),
      ownerName: assigneeName,
      creatorId: getActorId(record.createdBy),
      meta: getTaskStatusLabel(asString(record.status)),
      status: asString(record.status),
    });
  }

  for (const record of calls.records as LooseRecord[]) {
    items.push({
      id: `call-${String(record.id)}`,
      kind: 'call',
      date: asString(record.createdAt) ?? '',
      title: asString(record.title) ?? '',
      body: getMarkdown(record.bodyV2),
      ownerId: getActorId(record.createdBy),
      ownerName: getActorName(record.createdBy),
      creatorId: getActorId(record.createdBy),
      meta: [asString(record.direction), asString(record.outcome)]
        .filter(isNonEmptyString)
        .join(' · '),
    });
  }

  for (const record of meetings.records as LooseRecord[]) {
    items.push({
      id: `meeting-${String(record.id)}`,
      kind: 'meeting',
      date: asString(record.startsAt) ?? asString(record.createdAt) ?? '',
      title: asString(record.title) ?? '',
      body: asString(record.description) ?? '',
      ownerId: null,
      ownerName: '',
      creatorId: null,
      isCanceled: record.isCanceled === true,
      meta: [
        record.isCanceled === true ? t`Cancelled` : '',
        asString(record.location) ?? '',
      ]
        .filter(isNonEmptyString)
        .join(' · '),
    });
  }

  items.sort((first, second) => second.date.localeCompare(first.date));

  return {
    items: items.filter((item) => isDefined(item.date)),
    loading:
      emails.loading ||
      notes.loading ||
      tasks.loading ||
      calls.loading ||
      meetings.loading,
  };
};
