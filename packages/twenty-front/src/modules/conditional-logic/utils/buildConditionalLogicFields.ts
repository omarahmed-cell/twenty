import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import {
  type ConditionalLogicField,
  isNonEmptyArray,
} from 'twenty-shared/utils';

import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type FieldRelationMetadataSettings } from '@/object-record/record-field/ui/types/FieldMetadata';
import { getForeignKeyNameFromRelationFieldName } from '@/object-record/utils/getForeignKeyNameFromRelationFieldName';

// Only many-to-one relations hold a single value a condition or a required check can read
export const buildConditionalLogicFields = (
  fields: FieldMetadataItem[],
): ConditionalLogicField[] =>
  fields
    .filter((field) => field.isActive !== false && field.isSystem !== true)
    .flatMap((field): ConditionalLogicField[] => {
      if (field.type !== FieldMetadataType.RELATION) {
        return field.type === FieldMetadataType.MORPH_RELATION
          ? []
          : [
              {
                name: field.name,
                label: field.label,
                type: field.type,
                ...(isNonEmptyArray(field.options)
                  ? {
                      options: field.options.map(({ value, label }) => ({
                        value,
                        label,
                      })),
                    }
                  : {}),
              },
            ];
      }

      const settings = field.settings as FieldRelationMetadataSettings | null;

      if (settings?.relationType !== RelationType.MANY_TO_ONE) {
        return [];
      }

      return [
        {
          name: field.name,
          label: field.label,
          type: field.type,
          joinColumnName:
            settings.joinColumnName ??
            getForeignKeyNameFromRelationFieldName(field.name),
        },
      ];
    });
