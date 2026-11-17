import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import {
  type ConditionalLogicField,
  type ConditionalLogicRule,
  isDefined,
  resolveConditionalLogicProperties,
} from 'twenty-shared/utils';
import { Tag } from 'twenty-ui/primitives/data-display';
import { themeCssVariables } from 'twenty-ui/theme';
import { type JsonValue } from 'type-fest';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { formatFieldMetadataItemAsFieldDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsFieldDefinition';
import { FormFieldInput } from '@/object-record/record-field/ui/components/FormFieldInput';
import { buildConditionalLogicPreviewRecord } from '@/settings/data-model/conditional-logic/utils/buildConditionalLogicPreviewRecord';

const StyledPreview = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledBlockTitle = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledPropertyRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

type SettingsConditionalLogicPreviewProps = {
  rule: ConditionalLogicRule;
  hint: string;
  // Turns entries that stand for several properties, like a property group, into those properties
  expandRule?: (rule: ConditionalLogicRule) => ConditionalLogicRule;
  fields: ConditionalLogicField[];
  fieldMetadataItemByName: ReadonlyMap<string, FieldMetadataItem>;
  objectMetadataItem: EnrichedObjectMetadataItem;
};

export const SettingsConditionalLogicPreview = ({
  rule,
  hint,
  expandRule,
  fields,
  fieldMetadataItemByName,
  objectMetadataItem,
}: SettingsConditionalLogicPreviewProps) => {
  const { t } = useLingui();
  const [valuesByFieldName, setValuesByFieldName] = useState<
    Record<string, JsonValue>
  >({});

  const conditionFieldNames = [
    ...new Set(
      rule.conditionGroups.flatMap((group) =>
        group.conditions.map((condition) => condition.fieldName),
      ),
    ),
  ];

  const shownProperties = resolveConditionalLogicProperties({
    rules: [isDefined(expandRule) ? expandRule(rule) : rule],
    record: buildConditionalLogicPreviewRecord({ valuesByFieldName, fields }),
    fields,
  });

  const fieldByName = new Map(fields.map((field) => [field.name, field]));

  return (
    <StyledPreview>
      <StyledHint>{hint}</StyledHint>
      <StyledBlock>
        <StyledBlockTitle>{t`Condition values`}</StyledBlockTitle>
        {conditionFieldNames.length === 0 && (
          <StyledHint>{t`This rule has no extra conditions.`}</StyledHint>
        )}
        {conditionFieldNames.map((fieldName) => {
          const fieldMetadataItem = fieldMetadataItemByName.get(fieldName);

          if (!isDefined(fieldMetadataItem)) {
            return null;
          }

          const fieldDefinition = formatFieldMetadataItemAsFieldDefinition({
            field: fieldMetadataItem,
            objectMetadataItem,
          });

          return (
            <FormFieldInput
              key={fieldName}
              field={fieldDefinition}
              defaultValue={valuesByFieldName[fieldName] ?? null}
              onChange={(value) =>
                setValuesByFieldName((previous) => ({
                  ...previous,
                  [fieldName]: value,
                }))
              }
            />
          );
        })}
      </StyledBlock>
      <StyledBlock>
        <StyledBlockTitle>{t`Properties shown`}</StyledBlockTitle>
        {shownProperties.length === 0 && (
          <StyledHint>{t`No properties are shown for these values.`}</StyledHint>
        )}
        {shownProperties.map((property) => (
          <StyledPropertyRow key={property.fieldName}>
            <span>
              {fieldByName.get(property.fieldName)?.label ?? property.fieldName}
            </span>
            {property.isRequired ? (
              <Tag color="red">{t`Required`}</Tag>
            ) : (
              <Tag color="gray">{t`Optional`}</Tag>
            )}
          </StyledPropertyRow>
        ))}
      </StyledBlock>
    </StyledPreview>
  );
};
