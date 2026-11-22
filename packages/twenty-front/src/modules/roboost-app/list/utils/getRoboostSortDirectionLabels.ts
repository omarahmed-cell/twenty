import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { msg } from '@lingui/core/macro';
import { type MessageDescriptor } from '@lingui/core';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const NUMERIC_TYPES = new Set<string>([
  FieldMetadataType.NUMBER,
  FieldMetadataType.NUMERIC,
  FieldMetadataType.CURRENCY,
  FieldMetadataType.RATING,
]);

const DATE_TYPES = new Set<string>([
  FieldMetadataType.DATE,
  FieldMetadataType.DATE_TIME,
]);

export const getRoboostSortDirectionLabels = (
  field: Pick<FieldMetadataItem, 'type'> | undefined,
): { asc: MessageDescriptor; desc: MessageDescriptor } => {
  if (field !== undefined && NUMERIC_TYPES.has(field.type)) {
    return { asc: msg`Low → High`, desc: msg`High → Low` };
  }

  if (field !== undefined && DATE_TYPES.has(field.type)) {
    return { asc: msg`Oldest → Newest`, desc: msg`Newest → Oldest` };
  }

  return { asc: msg`A → Z`, desc: msg`Z → A` };
};
