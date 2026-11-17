import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import { type ConditionalLogicField, isDefined } from 'twenty-shared/utils';

import { getFlatFieldsFromFlatObjectMetadata } from 'src/engine/api/graphql/workspace-schema-builder/utils/get-flat-fields-for-flat-object-metadata.util';
import { computeMorphOrRelationFieldJoinColumnName } from 'src/engine/metadata-modules/field-metadata/utils/compute-morph-or-relation-field-join-column-name.util';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type OrmFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/orm-flat-field-metadata.type';
import { isMorphOrRelationFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/utils/is-morph-or-relation-flat-field-metadata.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';

type SelectOption = { value: string; label: string };

const toOptions = (options: unknown): SelectOption[] | undefined =>
  Array.isArray(options)
    ? options.flatMap((option) =>
        isDefined(option?.value) && isDefined(option?.label)
          ? [{ value: String(option.value), label: String(option.label) }]
          : [],
      )
    : undefined;

// Only many-to-one relations hold a single value a condition or a required check can read
export const buildConditionalLogicFieldsForObject = ({
  flatObjectMetadata,
  flatFieldMetadataMaps,
}: {
  flatObjectMetadata: FlatObjectMetadata;
  flatFieldMetadataMaps: FlatEntityMaps<OrmFlatFieldMetadata>;
}): ConditionalLogicField[] =>
  getFlatFieldsFromFlatObjectMetadata(
    flatObjectMetadata,
    flatFieldMetadataMaps,
  ).flatMap((field): ConditionalLogicField[] => {
    if (!isMorphOrRelationFlatFieldMetadata(field)) {
      return [
        {
          name: field.name,
          label: field.label,
          type: field.type,
          options: toOptions(field.options),
        },
      ];
    }

    if (
      field.type !== FieldMetadataType.RELATION ||
      field.settings.relationType !== RelationType.MANY_TO_ONE
    ) {
      return [];
    }

    return [
      {
        name: field.name,
        label: field.label,
        type: field.type,
        joinColumnName:
          field.settings.joinColumnName ??
          computeMorphOrRelationFieldJoinColumnName({ name: field.name }),
      },
    ];
  });
