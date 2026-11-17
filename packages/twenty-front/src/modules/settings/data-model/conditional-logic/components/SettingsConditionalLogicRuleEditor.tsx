import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import {
  type ConditionalLogicField,
  type ConditionalLogicRule,
} from 'twenty-shared/utils';
import { LightButton } from 'twenty-ui/components/input';
import { IconPlus } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { isCalculatedFieldMetadataItem } from '@/object-metadata/utils/isCalculatedFieldMetadataItem';
import { SettingsConditionalLogicConditionGroup } from '@/settings/data-model/conditional-logic/components/SettingsConditionalLogicConditionGroup';
import { SettingsConditionalLogicPreview } from '@/settings/data-model/conditional-logic/components/SettingsConditionalLogicPreview';
import { SettingsConditionalLogicPropertiesSection } from '@/settings/data-model/conditional-logic/components/SettingsConditionalLogicPropertiesSection';
import {
  addConditionalLogicCondition,
  addConditionalLogicGroup,
  addConditionalLogicProperty,
  changeConditionalLogicConditionField,
  changeConditionalLogicConditionOperator,
  changeConditionalLogicConditionValue,
  isConditionalLogicRuleDraftValid,
  moveConditionalLogicProperty,
  removeConditionalLogicCondition,
  removeConditionalLogicGroup,
  removeConditionalLogicProperty,
  setConditionalLogicPropertyRequired,
} from '@/settings/data-model/conditional-logic/utils/conditionalLogicRuleDraft';

const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

const StyledColumns = styled.div`
  display: grid;
  flex: 1;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  min-height: 0;
`;

const StyledPanel = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledSectionTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledSectionDescription = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledGroups = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledOr = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  text-align: center;
`;

type SettingsConditionalLogicRuleEditorProps = {
  draft: ConditionalLogicRule;
  onChange: (draft: ConditionalLogicRule) => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  fields: ConditionalLogicField[];
  fieldMetadataItemByName: ReadonlyMap<string, FieldMetadataItem>;
  objectMetadataItem: EnrichedObjectMetadataItem;
  previewHint: string;
  fixedConditionLabel?: string;
  extraPropertyOptions?: { value: string; label: string }[];
  expandRule?: (rule: ConditionalLogicRule) => ConditionalLogicRule;
};

// Shared by pipeline stage rules and property rules: conditions and dependent properties on the left, a live preview on the right
export const SettingsConditionalLogicRuleEditor = ({
  draft,
  onChange,
  onCancel,
  onSave,
  isSaving,
  fields,
  fieldMetadataItemByName,
  objectMetadataItem,
  previewHint,
  fixedConditionLabel,
  extraPropertyOptions,
  expandRule,
}: SettingsConditionalLogicRuleEditorProps) => {
  const { t } = useLingui();
  const calculatedFieldNames = new Set(
    [...fieldMetadataItemByName.values()]
      .filter(isCalculatedFieldMetadataItem)
      .map(({ name }) => name),
  );

  return (
    <>
      <StyledToolbar>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          {t`Cancel`}
        </Button>
        <Button
          variant="solid"
          color="accent"
          size="sm"
          onClick={onSave}
          disabled={isSaving || !isConditionalLogicRuleDraftValid(draft)}
        >
          {t`Save`}
        </Button>
      </StyledToolbar>
      <StyledColumns>
        <StyledPanel>
          <StyledSectionTitle>{t`Set conditions`}</StyledSectionTitle>
          <StyledSectionDescription>
            {t`All conditions in a group must be true. The rule applies when any group is true.`}
          </StyledSectionDescription>
          <StyledGroups>
            {draft.conditionGroups.map((group, groupIndex) => (
              <div key={group.id}>
                {groupIndex > 0 && <StyledOr>{t`OR`}</StyledOr>}
                <SettingsConditionalLogicConditionGroup
                  group={group}
                  groupIndex={groupIndex}
                  fixedConditionLabel={fixedConditionLabel}
                  fields={fields}
                  fieldMetadataItemByName={fieldMetadataItemByName}
                  canRemove={draft.conditionGroups.length > 1}
                  onAddCondition={(field) =>
                    onChange(
                      addConditionalLogicCondition(draft, group.id, field),
                    )
                  }
                  onChangeConditionField={(conditionId, field) =>
                    onChange(
                      changeConditionalLogicConditionField(
                        draft,
                        group.id,
                        conditionId,
                        field,
                      ),
                    )
                  }
                  onChangeConditionOperator={(conditionId, operator) =>
                    onChange(
                      changeConditionalLogicConditionOperator(
                        draft,
                        group.id,
                        conditionId,
                        operator,
                      ),
                    )
                  }
                  onChangeConditionValue={(conditionId, value) =>
                    onChange(
                      changeConditionalLogicConditionValue(
                        draft,
                        group.id,
                        conditionId,
                        value,
                      ),
                    )
                  }
                  onRemoveCondition={(conditionId) =>
                    onChange(
                      removeConditionalLogicCondition(
                        draft,
                        group.id,
                        conditionId,
                      ),
                    )
                  }
                  onRemove={() =>
                    onChange(removeConditionalLogicGroup(draft, group.id))
                  }
                />
              </div>
            ))}
          </StyledGroups>
          <LightButton
            startIcon={<IconPlus />}
            onClick={() => onChange(addConditionalLogicGroup(draft))}
          >
            {t`Add group`}
          </LightButton>
          <StyledSectionTitle>{t`Show these properties`}</StyledSectionTitle>
          <SettingsConditionalLogicPropertiesSection
            ruleId={draft.id}
            properties={draft.properties}
            fields={fields}
            extraOptions={extraPropertyOptions}
            unaddableFieldNames={calculatedFieldNames}
            onAdd={(fieldName) =>
              onChange(addConditionalLogicProperty(draft, fieldName))
            }
            onSetRequired={(fieldName, isRequired) =>
              onChange(
                setConditionalLogicPropertyRequired(
                  draft,
                  fieldName,
                  isRequired,
                ),
              )
            }
            onRemove={(fieldName) =>
              onChange(removeConditionalLogicProperty(draft, fieldName))
            }
            onMove={(fromIndex, toIndex) =>
              onChange(moveConditionalLogicProperty(draft, fromIndex, toIndex))
            }
          />
        </StyledPanel>
        <StyledPanel>
          <StyledSectionTitle>{t`Preview`}</StyledSectionTitle>
          <SettingsConditionalLogicPreview
            rule={draft}
            hint={previewHint}
            expandRule={expandRule}
            fields={fields}
            fieldMetadataItemByName={fieldMetadataItemByName}
            objectMetadataItem={objectMetadataItem}
          />
        </StyledPanel>
      </StyledColumns>
    </>
  );
};
