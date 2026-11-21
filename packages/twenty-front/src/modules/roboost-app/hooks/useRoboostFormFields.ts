import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { ROBOOST_DEFAULT_CREATE_FIELDS } from '@/roboost-app/constants/RoboostDefaultCreateFields';
import { getRoboostFieldEditKind } from '@/roboost-app/fields/getRoboostFieldEditKind';
import { getRoboostLabelIdentifierFieldName } from '@/roboost-app/fields/getRoboostRecordLabel';
import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
import { isDefined } from 'twenty-shared/utils';

export type RoboostFormFieldConfig = { fieldName: string; isRequired: boolean };
export type RoboostFormConfig = { fields: RoboostFormFieldConfig[] };
export type RoboostFormField = {
  field: FieldMetadataItem;
  isRequired: boolean;
};

export const getRoboostFormVarKey = (objectNameSingular: string) =>
  `roboost.forms.${objectNameSingular}`;

export const getRoboostDefaultFormConfig = (
  objectMetadataItem: EnrichedObjectMetadataItem,
): RoboostFormConfig => {
  const labelFieldName = getRoboostLabelIdentifierFieldName(objectMetadataItem);
  const fieldNames = ROBOOST_DEFAULT_CREATE_FIELDS[
    objectMetadataItem.nameSingular
  ] ?? [labelFieldName];
  const orderedNames = fieldNames.includes(labelFieldName)
    ? fieldNames
    : [labelFieldName, ...fieldNames];

  return {
    fields: orderedNames.map((fieldName) => ({
      fieldName,
      isRequired: fieldName === labelFieldName,
    })),
  };
};

// Fields of the create form, in order: the workspace's saved form (Settings → Forms) or the defaults
export const useRoboostFormFields = (
  objectMetadataItem: EnrichedObjectMetadataItem | undefined,
): RoboostFormField[] => {
  const { getWorkspaceDefault } = useRoboostUserVars();

  if (!isDefined(objectMetadataItem)) {
    return [];
  }

  const savedConfig = getWorkspaceDefault<RoboostFormConfig>(
    getRoboostFormVarKey(objectMetadataItem.nameSingular),
  );
  const config =
    isDefined(savedConfig) && Array.isArray(savedConfig.fields)
      ? savedConfig
      : getRoboostDefaultFormConfig(objectMetadataItem);

  return config.fields
    .map(({ fieldName, isRequired }) => {
      const field = objectMetadataItem.fields.find(
        (candidate) => candidate.name === fieldName && candidate.isActive,
      );

      return isDefined(field) && getRoboostFieldEditKind(field) !== null
        ? { field, isRequired }
        : undefined;
    })
    .filter(isDefined);
};
