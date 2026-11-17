import { useMemo } from 'react';
import { resolveHiddenPropertyFieldNames } from 'twenty-shared/utils';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { usePropertyLogicRules } from '@/properties/hooks/usePropertyLogicRules';

const NO_HIDDEN_FIELD_NAMES = new Set<string>();

// Values of hidden fields stay stored; only the record page, side panel and create form leave them out
export const usePropertyLogicHiddenFieldNames = ({
  objectMetadataItem,
  record,
}: {
  objectMetadataItem:
    | Pick<EnrichedObjectMetadataItem, 'id' | 'isSystem' | 'fields'>
    | undefined;
  record: Record<string, unknown> | null | undefined;
}): Set<string> => {
  const { rules, fields } = usePropertyLogicRules(objectMetadataItem);

  return useMemo(
    () =>
      rules.length === 0
        ? NO_HIDDEN_FIELD_NAMES
        : resolveHiddenPropertyFieldNames({
            expandedRules: rules,
            record: record ?? {},
            fields,
          }),
    [rules, fields, record],
  );
};
