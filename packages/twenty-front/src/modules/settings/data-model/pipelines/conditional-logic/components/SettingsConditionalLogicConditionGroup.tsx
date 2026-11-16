import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import {
  type ConditionalLogicConditionGroup,
  type ConditionalLogicConditionValue,
  type ConditionalLogicField,
  type ConditionalLogicOperator,
  getConditionalLogicOperators,
  isDefined,
} from 'twenty-shared/utils';
import { LightIconButton } from 'twenty-ui/components/input';
import { IconTrash, IconX } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { SettingsConditionalLogicConditionValueInput } from '@/settings/data-model/pipelines/conditional-logic/components/SettingsConditionalLogicConditionValueInput';
import { getConditionalLogicOperatorLabel } from '@/settings/data-model/pipelines/conditional-logic/utils/getConditionalLogicOperatorLabel';
import { Select } from '@/ui/input/components/Select';

const StyledGroup = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledGroupHeader = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-weight: ${themeCssVariables.font.weight.medium};
  justify-content: space-between;
`;

const StyledFixedCondition = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledConjunction = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledConditionRow = styled.div`
  align-items: flex-start;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) minmax(
      160px,
      1.4fr
    ) 24px;
`;

const StyledValueContainer = styled.div`
  min-width: 0;
`;

const ADD_CONDITION_PLACEHOLDER = '';

type SettingsConditionalLogicConditionGroupProps = {
  group: ConditionalLogicConditionGroup;
  groupIndex: number;
  stageLabel: string;
  stageFieldLabel: string;
  fields: ConditionalLogicField[];
  fieldMetadataItemByName: ReadonlyMap<string, FieldMetadataItem>;
  canRemove: boolean;
  onAddCondition: (field: ConditionalLogicField) => void;
  onChangeConditionField: (
    conditionId: string,
    field: ConditionalLogicField,
  ) => void;
  onChangeConditionOperator: (
    conditionId: string,
    operator: ConditionalLogicOperator,
  ) => void;
  onChangeConditionValue: (
    conditionId: string,
    value: ConditionalLogicConditionValue,
  ) => void;
  onRemoveCondition: (conditionId: string) => void;
  onRemove: () => void;
};

export const SettingsConditionalLogicConditionGroup = ({
  group,
  groupIndex,
  stageLabel,
  stageFieldLabel,
  fields,
  fieldMetadataItemByName,
  canRemove,
  onAddCondition,
  onChangeConditionField,
  onChangeConditionOperator,
  onChangeConditionValue,
  onRemoveCondition,
  onRemove,
}: SettingsConditionalLogicConditionGroupProps) => {
  const { t } = useLingui();
  const fieldByName = new Map(fields.map((field) => [field.name, field]));
  const fieldOptions = fields.map((field) => ({
    label: field.label,
    value: field.name,
  }));
  const groupNumber = groupIndex + 1;

  return (
    <StyledGroup>
      <StyledGroupHeader>
        {t`Group ${groupNumber}`}
        {canRemove && (
          <LightIconButton
            aria-label={t`Remove group`}
            emphasis="subtle"
            onClick={onRemove}
          >
            <IconTrash />
          </LightIconButton>
        )}
      </StyledGroupHeader>
      <StyledFixedCondition>
        {t`${stageFieldLabel} is equal to ${stageLabel}`}
      </StyledFixedCondition>
      {group.conditions.map((condition) => {
        const field = fieldByName.get(condition.fieldName);
        const fieldMetadataItem = fieldMetadataItemByName.get(
          condition.fieldName,
        );

        return (
          <div key={condition.id}>
            <StyledConjunction>{t`AND`}</StyledConjunction>
            <StyledConditionRow>
              <Select
                dropdownId={`conditional-logic-field-${condition.id}`}
                options={fieldOptions}
                value={condition.fieldName}
                withSearchInput
                fullWidth
                onChange={(fieldName) => {
                  const nextField = fieldByName.get(fieldName);

                  if (isDefined(nextField)) {
                    onChangeConditionField(condition.id, nextField);
                  }
                }}
              />
              <Select
                dropdownId={`conditional-logic-operator-${condition.id}`}
                options={(isDefined(field)
                  ? getConditionalLogicOperators(field)
                  : [condition.operator]
                ).map((operator) => ({
                  label: getConditionalLogicOperatorLabel(operator),
                  value: operator,
                }))}
                value={condition.operator}
                fullWidth
                onChange={(operator) =>
                  onChangeConditionOperator(condition.id, operator)
                }
              />
              <StyledValueContainer>
                {isDefined(fieldMetadataItem) && (
                  <SettingsConditionalLogicConditionValueInput
                    key={`${condition.fieldName}-${condition.operator}`}
                    condition={condition}
                    fieldMetadataItem={fieldMetadataItem}
                    onChange={(value) =>
                      onChangeConditionValue(condition.id, value)
                    }
                  />
                )}
              </StyledValueContainer>
              <LightIconButton
                aria-label={t`Remove condition`}
                emphasis="subtle"
                onClick={() => onRemoveCondition(condition.id)}
              >
                <IconX />
              </LightIconButton>
            </StyledConditionRow>
          </div>
        );
      })}
      <Select
        dropdownId={`conditional-logic-add-condition-${group.id}`}
        options={fieldOptions}
        value={ADD_CONDITION_PLACEHOLDER}
        emptyOption={{ label: t`Add condition`, value: '' }}
        withSearchInput
        onChange={(fieldName) => {
          const field = fieldByName.get(fieldName);

          if (isDefined(field)) {
            onAddCondition(field);
          }
        }}
      />
    </StyledGroup>
  );
};
