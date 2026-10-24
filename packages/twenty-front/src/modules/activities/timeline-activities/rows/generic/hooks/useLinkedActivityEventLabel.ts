import { isNonEmptyString } from '@sniptt/guards';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { getLinkedActivityEventLabel } from '@/activities/timeline-activities/rows/generic/utils/getLinkedActivityEventLabel';

const DETAIL_FIELD_NAME_BY_OBJECT_NAME_SINGULAR: Partial<
  Record<string, string>
> = {
  [CoreObjectNameSingular.Call]: 'outcome',
  [CoreObjectNameSingular.Communication]: 'channelType',
};

export const useLinkedActivityEventLabel = ({
  linkedObjectMetadataItem,
  linkedRecordId,
  eventTypeLabel,
  isLinkedEvent,
}: {
  linkedObjectMetadataItem: EnrichedObjectMetadataItem | null | undefined;
  linkedRecordId: string | null | undefined;
  eventTypeLabel: string | undefined;
  isLinkedEvent: boolean;
}): string | undefined => {
  const objectNameSingular = linkedObjectMetadataItem?.nameSingular;
  const detailFieldName = isDefined(objectNameSingular)
    ? DETAIL_FIELD_NAME_BY_OBJECT_NAME_SINGULAR[objectNameSingular]
    : undefined;

  const { record } = useFindOneRecord({
    objectNameSingular: objectNameSingular ?? CoreObjectNameSingular.Call,
    objectRecordId: linkedRecordId ?? undefined,
    recordGqlFields: {
      id: true,
      ...(detailFieldName ? { [detailFieldName]: true } : {}),
    },
    skip: !isDefined(detailFieldName),
  });

  if (!isDefined(detailFieldName) || !isDefined(record)) {
    return eventTypeLabel;
  }

  const detailValue = record[detailFieldName];
  const detailLabel = linkedObjectMetadataItem?.fields
    .find((field) => field.name === detailFieldName)
    ?.options?.find((option) => option.value === detailValue)?.label;

  if (!isNonEmptyString(detailLabel)) {
    return eventTypeLabel;
  }

  return getLinkedActivityEventLabel({
    objectNameSingular: objectNameSingular ?? CoreObjectNameSingular.Call,
    detailLabel,
    eventTypeLabel,
    isLinkedEvent,
  });
};
