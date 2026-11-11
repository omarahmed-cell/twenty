import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { type TimelineActivityAction } from 'twenty-shared/timeline';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { getLinkedActivityEventLabel } from '@/activities/timeline-activities/rows/generic/utils/getLinkedActivityEventLabel';
import { getActivityPreview } from '@/activities/utils/getActivityPreview';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';

const DETAIL_FIELD_NAME_BY_OBJECT_NAME_SINGULAR: Partial<
  Record<string, string>
> = {
  [CoreObjectNameSingular.Call]: 'outcome',
  [CoreObjectNameSingular.Communication]: 'channelType',
  [CoreObjectNameSingular.Email]: 'subject',
};

const OBJECT_NAME_SINGULARS_WITH_BODY: string[] = [
  CoreObjectNameSingular.Note,
  CoreObjectNameSingular.Task,
  CoreObjectNameSingular.Call,
  CoreObjectNameSingular.Communication,
  CoreObjectNameSingular.Email,
];

export const useLinkedActivityEventDescription = ({
  linkedObjectMetadataItem,
  linkedRecordId,
  action,
  eventTypeLabel,
}: {
  linkedObjectMetadataItem: EnrichedObjectMetadataItem | null | undefined;
  linkedRecordId: string | null | undefined;
  action: TimelineActivityAction | null;
  eventTypeLabel: string | undefined;
}): { actionLabel: string; preview: string | undefined } => {
  const objectNameSingular = linkedObjectMetadataItem?.nameSingular;
  const objectLabel =
    linkedObjectMetadataItem?.labelSingular?.toLowerCase() ?? t`record`;
  const detailFieldName = isDefined(objectNameSingular)
    ? DETAIL_FIELD_NAME_BY_OBJECT_NAME_SINGULAR[objectNameSingular]
    : undefined;
  const hasBody =
    isDefined(objectNameSingular) &&
    OBJECT_NAME_SINGULARS_WITH_BODY.includes(objectNameSingular);
  const isEmail = objectNameSingular === CoreObjectNameSingular.Email;

  const { record } = useFindOneRecord({
    objectNameSingular: objectNameSingular ?? CoreObjectNameSingular.Note,
    objectRecordId: linkedRecordId ?? undefined,
    recordGqlFields: {
      id: true,
      ...(hasBody ? { bodyV2: true } : {}),
      ...(isDefined(detailFieldName) ? { [detailFieldName]: true } : {}),
      ...(isEmail ? { direction: true } : {}),
    },
    skip: !hasBody || !isDefined(linkedRecordId),
  });

  const detailLabel = isEmail
    ? (record?.subject ?? undefined)
    : isDefined(detailFieldName)
      ? linkedObjectMetadataItem?.fields
          .find((field) => field.name === detailFieldName)
          ?.options?.find(
            (option) => option.value === record?.[detailFieldName],
          )?.label
      : undefined;

  const preview = getActivityPreview(record?.bodyV2?.blocknote ?? null)
    .split('\n')
    .find(isNonEmptyString);

  return {
    actionLabel: getLinkedActivityEventLabel({
      action,
      objectNameSingular,
      objectLabel,
      detailLabel,
      eventTypeLabel,
      emailDirection: isEmail ? (record?.direction ?? undefined) : undefined,
    }),
    preview,
  };
};
