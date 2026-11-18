import { type Attachment } from '@/activities/files/types/Attachment';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { getActivityTargetsFilter } from '@/activities/utils/getActivityTargetsFilter';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { t } from '@lingui/core/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const LINKED_ACTIVITIES_LIMIT = 200;

type NoteTargetWithNote = {
  __typename: string;
  id: string;
  noteId: string | null;
  note?: { id: string; title: string | null } | null;
};

type EmailTargetWithEmail = {
  __typename: string;
  id: string;
  emailId: string | null;
  email?: { id: string; subject: string | null } | null;
};

type LinkedAttachment = Attachment & {
  targetEmailId?: string | null;
};

const getLinkedTargetsFilter = (
  junctionObjectNameSingular: string,
  targetRecord: ActivityTargetableObject,
  objectMetadataItems: EnrichedObjectMetadataItem[],
) => {
  const junctionObjectMetadata = objectMetadataItems.find(
    (objectMetadataItem) =>
      objectMetadataItem.nameSingular === junctionObjectNameSingular,
  );

  if (!isDefined(junctionObjectMetadata)) {
    return undefined;
  }

  const filter = getActivityTargetsFilter({
    targetableObjects: [targetRecord],
    activityTargetObjectMetadata: junctionObjectMetadata,
    objectMetadataItems,
  });

  return filter.or.length > 0 ? filter : undefined;
};

export const useLinkedActivityAttachments = (
  targetRecord: ActivityTargetableObject,
) => {
  const objectMetadataItems = useAtomStateValue<EnrichedObjectMetadataItem[]>(
    objectMetadataItemsSelector,
  );

  const noteTargetsFilter = getLinkedTargetsFilter(
    CoreObjectNameSingular.NoteTarget,
    targetRecord,
    objectMetadataItems,
  );
  const emailTargetsFilter = getLinkedTargetsFilter(
    CoreObjectNameSingular.EmailTarget,
    targetRecord,
    objectMetadataItems,
  );

  const { records: noteTargets, loading: loadingNoteTargets } =
    useFindManyRecords<NoteTargetWithNote>({
      objectNameSingular: CoreObjectNameSingular.NoteTarget,
      filter: noteTargetsFilter,
      skip: !isDefined(noteTargetsFilter),
      recordGqlFields: {
        id: true,
        noteId: true,
        note: { id: true, title: true },
      },
      orderBy: [{ createdAt: 'DescNullsLast' }],
      limit: LINKED_ACTIVITIES_LIMIT,
    });

  const { records: emailTargets, loading: loadingEmailTargets } =
    useFindManyRecords<EmailTargetWithEmail>({
      objectNameSingular: CoreObjectNameSingular.EmailTarget,
      filter: emailTargetsFilter,
      skip: !isDefined(emailTargetsFilter),
      recordGqlFields: {
        id: true,
        emailId: true,
        email: { id: true, subject: true },
      },
      orderBy: [{ createdAt: 'DescNullsLast' }],
      limit: LINKED_ACTIVITIES_LIMIT,
    });

  const noteTitleById = new Map(
    noteTargets
      .filter((noteTarget) => isDefined(noteTarget.noteId))
      .map((noteTarget) => [
        noteTarget.noteId as string,
        noteTarget.note?.title ?? '',
      ]),
  );
  const emailSubjectById = new Map(
    emailTargets
      .filter((emailTarget) => isDefined(emailTarget.emailId))
      .map((emailTarget) => [
        emailTarget.emailId as string,
        emailTarget.email?.subject ?? '',
      ]),
  );

  const attachmentFilters = [
    ...(noteTitleById.size > 0
      ? [{ targetNoteId: { in: [...noteTitleById.keys()] } }]
      : []),
    ...(emailSubjectById.size > 0
      ? [{ targetEmailId: { in: [...emailSubjectById.keys()] } }]
      : []),
  ];

  const { records: linkedAttachments, loading: loadingAttachments } =
    useFindManyRecords<LinkedAttachment>({
      objectNameSingular: CoreObjectNameSingular.Attachment,
      filter: { or: attachmentFilters },
      skip:
        attachmentFilters.length === 0 ||
        loadingNoteTargets ||
        loadingEmailTargets,
      orderBy: [{ createdAt: 'DescNullsFirst' }],
      limit: LINKED_ACTIVITIES_LIMIT,
    });

  const getSourceLabel = (attachment: LinkedAttachment) => {
    const title = isDefined(attachment.targetNoteId)
      ? noteTitleById.get(attachment.targetNoteId)
      : undefined;

    if (isDefined(title)) {
      return t`From note: ${title}`;
    }

    const subject = isDefined(attachment.targetEmailId)
      ? emailSubjectById.get(attachment.targetEmailId)
      : undefined;

    if (isDefined(subject)) {
      return t`From email: ${subject}`;
    }

    return undefined;
  };

  const sourceLabelByAttachmentId: Record<string, string> = {};

  for (const attachment of linkedAttachments) {
    const sourceLabel = getSourceLabel(attachment);

    if (isDefined(sourceLabel)) {
      sourceLabelByAttachmentId[attachment.id] = sourceLabel;
    }
  }

  return {
    linkedAttachments: attachmentFilters.length > 0 ? linkedAttachments : [],
    sourceLabelByAttachmentId,
    loadingLinkedAttachments:
      loadingNoteTargets || loadingEmailTargets || loadingAttachments,
  };
};
