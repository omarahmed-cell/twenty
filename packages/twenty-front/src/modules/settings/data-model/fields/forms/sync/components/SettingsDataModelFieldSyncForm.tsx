import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { Select } from '@/ui/input/components/Select';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { type FieldSyncPolicy } from 'twenty-shared/types';
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

export type SettingsDataModelFieldSyncFormValue = {
  relationFieldMetadataId?: string;
  sourceField?: FieldMetadataItem;
  policy?: FieldSyncPolicy;
};

type SettingsDataModelFieldSyncFormProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  value: SettingsDataModelFieldSyncFormValue;
  onChange: (value: SettingsDataModelFieldSyncFormValue) => void;
};

const isSyncedField = (field: FieldMetadataItem) =>
  isDefined((field.settings as { sync?: unknown } | null | undefined)?.sync);

export const SettingsDataModelFieldSyncForm = ({
  objectMetadataItem,
  value,
  onChange,
}: SettingsDataModelFieldSyncFormProps) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();

  const relationFields = objectMetadataItem.fields.filter(
    (field) =>
      field.isActive === true &&
      (field.relation?.type === RelationType.MANY_TO_ONE ||
        field.relation?.type === RelationType.ONE_TO_MANY),
  );

  const selectedRelationField = relationFields.find(
    (field) => field.id === value.relationFieldMetadataId,
  );

  const isToManyRelation =
    selectedRelationField?.relation?.type === RelationType.ONE_TO_MANY;

  const associatedObjectMetadataItem = objectMetadataItems.find(
    (item) =>
      item.id === selectedRelationField?.relation?.targetObjectMetadata.id,
  );

  const sourceFields = (associatedObjectMetadataItem?.fields ?? []).filter(
    (field) =>
      field.isActive === true &&
      field.isSystem !== true &&
      !isSyncedField(field) &&
      isDefined(getFieldSyncTargetFieldType(field.type)),
  );

  return (
    <StyledContainer>
      <Select
        dropdownId="field-sync-relation-select"
        label={t`Associated record`}
        fullWidth
        withSearchInput
        value={value.relationFieldMetadataId}
        emptyOption={{ label: t`Pick a relation`, value: '' }}
        options={relationFields.map((field) => {
          const targetObjectLabel =
            objectMetadataItems.find(
              (item) => item.id === field.relation?.targetObjectMetadata.id,
            )?.labelSingular ?? '';

          return {
            label: `${field.label} (${targetObjectLabel})`,
            value: field.id,
          };
        })}
        onChange={(relationFieldMetadataId) =>
          onChange({
            relationFieldMetadataId: isNonEmptyString(relationFieldMetadataId)
              ? relationFieldMetadataId
              : undefined,
            sourceField: undefined,
          })
        }
      />
      {isDefined(associatedObjectMetadataItem) && (
        <Select
          dropdownId="field-sync-source-select"
          label={t`Property to sync`}
          fullWidth
          withSearchInput
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
