import { useMemo } from 'react';

import { buildConditionalLogicFields } from '@/conditional-logic/utils/buildConditionalLogicFields';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { usePropertySettings } from '@/properties/hooks/usePropertySettings';
import { buildObjectPropertyLogicRules } from '@/properties/utils/buildObjectPropertyLogicRules';

export const usePropertyLogicRules = (
  objectMetadataItem:
    | Pick<EnrichedObjectMetadataItem, 'id' | 'isSystem' | 'fields'>
    | undefined,
) => {
  const { propertySettings } = usePropertySettings({
    enabled: objectMetadataItem?.isSystem === false,
  });

  const rules = useMemo(
    () =>
      objectMetadataItem?.isSystem === false
        ? buildObjectPropertyLogicRules({
            propertySettings,
            objectMetadataId: objectMetadataItem.id,
            fields: objectMetadataItem.fields,
          })
        : [],
    [propertySettings, objectMetadataItem],
  );

  const fields = useMemo(
    () => buildConditionalLogicFields(objectMetadataItem?.fields ?? []),
    [objectMetadataItem?.fields],
  );

  return { rules, fields };
};
