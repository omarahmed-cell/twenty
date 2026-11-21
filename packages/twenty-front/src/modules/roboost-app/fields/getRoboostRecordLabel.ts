import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getRoboostPersonName } from '@/roboost-app/utils/getRoboostPersonName';
import { isNonEmptyString, isString } from '@sniptt/guards';

type LabelledRecord = Record<string, unknown> & { id: string };

export const getRoboostLabelIdentifierFieldName = (
  objectMetadataItem: EnrichedObjectMetadataItem | undefined,
) =>
  objectMetadataItem?.fields.find(
    (field) => field.id === objectMetadataItem.labelIdentifierFieldMetadataId,
  )?.name ?? 'name';

export const getRoboostRecordLabel = (
  record: LabelledRecord | null | undefined,
  objectMetadataItem?: EnrichedObjectMetadataItem,
) => {
  if (record === null || record === undefined) {
    return '';
  }
  const value = record[getRoboostLabelIdentifierFieldName(objectMetadataItem)];

  if (isString(value)) {
    return value;
  }

  const fullName = getRoboostPersonName(
    value as { firstName?: string; lastName?: string } | undefined,
  );

  if (isNonEmptyString(fullName)) {
    return fullName;
  }

  return isString(record.name)
    ? record.name
    : isString(record.title)
      ? record.title
      : getRoboostPersonName(
          record.name as { firstName?: string; lastName?: string },
        );
};
