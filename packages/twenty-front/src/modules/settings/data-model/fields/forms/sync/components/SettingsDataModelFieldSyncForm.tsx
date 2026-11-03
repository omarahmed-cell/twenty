import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getLoopFieldLabels } from '@/settings/data-model/fields/forms/formula/utils/validateFormula';
import { getFieldSyncSettings } from '@/settings/data-model/fields/forms/sync/utils/getSyncFormValueFromField';
import { Select } from '@/ui/input/components/Select';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import {
  CoreObjectNameSingular,
  type FieldSyncPolicy,
} from 'twenty-shared/types';
import { getFieldSyncTargetFieldType, isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';
import { RelationType } from '~/generated-metadata/graphql';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledWarning = styled.div`
  color: ${themeCssVariables.font.color.danger};
`;

export type SettingsDataModelFieldSyncFormValue = {
  relationFieldMetadataId?: string;
  sourceField?: FieldMetadataItem;
  policy?: FieldSyncPolicy;
};

type SettingsDataModelFieldSyncFormProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  value: SettingsDataModelFieldSyncFormValue;
  onChange: (value: SettingsDataModelFieldSyncFormValue) => void;
  // An existing field's column type is fixed, so only sources of a matching type can be
  // offered, and a source that reads this field back would create a loop.
  targetField?: FieldMetadataItem;
  isPaused?: boolean;
  disabled?: boolean;
};

export const SettingsDataModelFieldSyncForm = ({
  objectMetadataItem,
  value,
  onChange,
  targetField,
  isPaused = false,
  disabled = false,
}: SettingsDataModelFieldSyncFormProps) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();

  const findObjectMetadataItem = (field: FieldMetadataItem) =>
    objectMetadataItems.find(
      (item) => item.id === field.relation?.targetObjectMetadata.id,
    );

  const relationFields = objectMetadataItem.fields.filter((field) => {
    if (
      field.isActive !== true ||
      (field.relation?.type !== RelationType.MANY_TO_ONE &&
        field.relation?.type !== RelationType.ONE_TO_MANY)
    ) {
      return false;
    }

    const targetObject = findObjectMetadataItem(field);

    // System objects are internal plumbing (timeline, attachments, junctions), apart from workspace members.
    return (
      field.id === value.relationFieldMetadataId ||
      targetObject?.isSystem !== true ||
      targetObject.nameSingular === CoreObjectNameSingular.WorkspaceMember
    );
  });

  const selectedRelationField = relationFields.find(
    (field) => field.id === value.relationFieldMetadataId,
  );

  const isToManyRelation =
    selectedRelationField?.relation?.type === RelationType.ONE_TO_MANY;

  const associatedObjectMetadataItem = isDefined(selectedRelationField)
    ? findObjectMetadataItem(selectedRelationField)
    : undefined;

  const sourceFields = (associatedObjectMetadataItem?.fields ?? []).filter(
    (field) => {
      const syncedFieldType = getFieldSyncTargetFieldType(field.type);

      return (
        field.isActive === true &&
        field.isSystem !== true &&
        !isDefined(getFieldSyncSettings(field)) &&
        isDefined(syncedFieldType) &&
        (!isDefined(targetField) ||
          (syncedFieldType === targetField.type &&
            getLoopFieldLabels(objectMetadataItems, targetField.id, {
              sync: {
                relationFieldMetadataId: value.relationFieldMetadataId,
                sourceFieldMetadataId: field.id,
              },
            }).length === 0))
      );
    },
  );

  return (
    <StyledContainer>
      {isPaused && (
        <StyledWarning>
          {t`This field stopped syncing because its source or relation was removed or deactivated, or it is part of a loop. It keeps its last values. Pick a new source to resume.`}
        </StyledWarning>
      )}
      <Select
        dropdownId="field-sync-relation-select"
        label={t`Associated record`}
        fullWidth
        withSearchInput
        disabled={disabled}
        value={value.relationFieldMetadataId}
        emptyOption={{ label: t`Pick a relation`, value: '' }}
        options={relationFields.map((field) => ({
          label: `${field.label} (${findObjectMetadataItem(field)?.labelSingular ?? ''})`,
          value: field.id,
        }))}
        onChange={(relationFieldMetadataId) =>
          onChange({
            relationFieldMetadataId: isNonEmptyString(relationFieldMetadataId)
              ? relationFieldMetadataId
              : undefined,
            sourceField: undefined,
            policy: undefined,
          })
        }
      />
      {isDefined(associatedObjectMetadataItem) && (
        <Select
          dropdownId="field-sync-source-select"
          label={t`Property to sync`}
          fullWidth
          withSearchInput
          disabled={disabled}
          value={value.sourceField?.id}
          emptyOption={{ label: t`Pick a property`, value: '' }}
          options={sourceFields.map((field) => ({
            label: field.label,
            value: field.id,
          }))}
          onChange={(sourceFieldMetadataId) =>
            onChange({
              ...value,
              sourceField: sourceFields.find(
                (field) => field.id === sourceFieldMetadataId,
              ),
            })
          }
        />
      )}
      {isToManyRelation && (
        <Select<FieldSyncPolicy>
          dropdownId="field-sync-policy-select"
          label={t`When several records are associated, use`}
          fullWidth
          disabled={disabled}
          value={value.policy ?? 'MOST_RECENTLY_CREATED'}
          options={[
            { label: t`Most recently created`, value: 'MOST_RECENTLY_CREATED' },
            { label: t`First created`, value: 'FIRST_CREATED' },
          ]}
          onChange={(policy) => onChange({ ...value, policy })}
        />
      )}
      <StyledHint>
        {relationFields.length === 0
          ? t`This object has no relation to an associated record yet.`
          : t`The value is copied from the associated record and stays read-only.`}
      </StyledHint>
    </StyledContainer>
  );
};
