import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import {
  type ConditionalLogicField,
  type ConditionalLogicProperty,
  isDefined,
} from 'twenty-shared/utils';
import { LightIconButton } from 'twenty-ui/components/input';
import { IconX } from 'twenty-ui/icon';
import { Switch } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { SettingsPipelineDragHandle } from '@/settings/data-model/pipelines/components/SettingsPipelineDragHandle';
import { Select } from '@/ui/input/components/Select';
import { DraggableItem } from '@/ui/layout/draggable-list/components/DraggableItem';
import { DraggableList } from '@/ui/layout/draggable-list/components/DraggableList';

const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledPropertyRow = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 24px 1fr auto 24px;
  margin-bottom: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledRequired = styled.label`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

type SettingsConditionalLogicPropertiesSectionProps = {
  ruleId: string;
  properties: ConditionalLogicProperty[];
  fields: ConditionalLogicField[];
  // Entries that are not fields, such as property groups; their value is stored as the property name
  extraOptions?: { value: string; label: string }[];
  unaddableFieldNames?: ReadonlySet<string>;
  onAdd: (fieldName: string) => void;
  onSetRequired: (fieldName: string, isRequired: boolean) => void;
  onRemove: (fieldName: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
};

export const SettingsConditionalLogicPropertiesSection = ({
  ruleId,
  properties,
  fields,
  extraOptions = [],
  unaddableFieldNames,
  onAdd,
  onSetRequired,
  onRemove,
  onMove,
}: SettingsConditionalLogicPropertiesSectionProps) => {
  const { t } = useLingui();
  const labelByName = new Map([
    ...fields.map((field): [string, string] => [field.name, field.label]),
    ...extraOptions.map(({ value, label }): [string, string] => [value, label]),
  ]);
  const addableOptions = [
    ...extraOptions,
    ...fields
      .filter((field) => unaddableFieldNames?.has(field.name) !== true)
      .map((field) => ({ label: field.label, value: field.name })),
  ].filter(
    (option) =>
      !properties.some((property) => property.fieldName === option.value),
  );

  return (
    <StyledSection>
      {properties.length === 0 && (
        <StyledEmpty>{t`Pick the properties this rule shows.`}</StyledEmpty>
      )}
      <DraggableList
        onDragEnd={(result) => {
          if (isDefined(result.destination)) {
            onMove(result.source.index, result.destination.index);
          }
        }}
        draggableItems={
          <>
            {properties.map((property, index) => {
              const fieldLabel =
                labelByName.get(property.fieldName) ?? property.fieldName;

              return (
                <DraggableItem
                  key={property.fieldName}
                  draggableId={`${ruleId}-${property.fieldName}`}
                  index={index}
                  itemComponent={
                    <StyledPropertyRow>
                      <SettingsPipelineDragHandle />
                      <span>{fieldLabel}</span>
                      <StyledRequired>
                        {t`Required`}
                        <Switch
                          checked={property.isRequired}
                          size="sm"
                          aria-label={t`${fieldLabel} is required`}
                          onCheckedChange={(checked: boolean) =>
                            onSetRequired(property.fieldName, checked)
                          }
                        />
                      </StyledRequired>
                      <LightIconButton
                        aria-label={t`Remove ${fieldLabel}`}
                        emphasis="subtle"
                        onClick={() => onRemove(property.fieldName)}
                      >
                        <IconX />
                      </LightIconButton>
                    </StyledPropertyRow>
                  }
                />
              );
            })}
          </>
        }
      />
      <Select
        dropdownId={`conditional-logic-add-property-${ruleId}`}
        options={addableOptions}
        value=""
        emptyOption={{ label: t`Add property`, value: '' }}
        withSearchInput
        onChange={(fieldName) => {
          if (fieldName !== '') {
            onAdd(fieldName);
          }
        }}
      />
    </StyledSection>
  );
};
