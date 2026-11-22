import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getRoboostFieldEditKind } from '@/roboost-app/fields/getRoboostFieldEditKind';
import {
  getRoboostLabelIdentifierFieldName,
  getRoboostRecordLabel,
} from '@/roboost-app/fields/getRoboostRecordLabel';
import { isString } from '@sniptt/guards';
import { isDefined, isPlainObject } from 'twenty-shared/utils';

const stripTypename = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stripTypename);
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== '__typename')
        .map(([key, nested]) => [key, stripTypename(nested)]),
    );
  }

  return value;
};

export const buildRoboostCloneValues = (
  objectMetadataItem: EnrichedObjectMetadataItem,
  record: Record<string, unknown>,
  objectMetadataItems: EnrichedObjectMetadataItem[],
  copySuffix: string,
) => {
  const initialValues: Record<string, unknown> = {};
  const initialRelatedRecords: Record<string, { id: string; label: string }> =
    {};
  const labelFieldName = getRoboostLabelIdentifierFieldName(objectMetadataItem);

  for (const field of objectMetadataItem.fields) {
    const value = record[field.name];

    if (
      !field.isActive ||
      !isDefined(value) ||
      getRoboostFieldEditKind(field) === null
    ) {
      continue;
    }
    if (isDefined(field.relation)) {
      const related = value as { id?: string } & Record<string, unknown>;

      if (!isDefined(related.id)) {
        continue;
      }
      const target = objectMetadataItems.find(
        (item) =>
          item.nameSingular ===
          field.relation?.targetObjectMetadata.nameSingular,
      );

      initialValues[field.name] = related.id;
      initialRelatedRecords[field.name] = {
        id: related.id,
        label: getRoboostRecordLabel(
          related as Record<string, unknown> & { id: string },
          target,
        ),
      };
      continue;
    }
    initialValues[field.name] =
      field.name === labelFieldName && isString(value)
        ? `${value} ${copySuffix}`
        : stripTypename(value);
  }

  return { initialValues, initialRelatedRecords };
};
