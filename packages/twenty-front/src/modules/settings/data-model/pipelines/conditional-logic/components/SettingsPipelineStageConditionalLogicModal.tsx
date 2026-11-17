import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { type ConditionalLogicRule, isDefined } from 'twenty-shared/utils';
import { LightButton, LightIconButton } from 'twenty-ui/components/input';
import { IconPencil, IconPlus, IconTrash } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { buildConditionalLogicFields } from '@/conditional-logic/utils/buildConditionalLogicFields';
import { type PipelineStageConfig } from '@/pipeline/types/PipelineConfig';
import { SettingsConditionalLogicRuleEditor } from '@/settings/data-model/conditional-logic/components/SettingsConditionalLogicRuleEditor';
import { CONDITIONAL_LOGIC_EXCLUDED_FIELD_NAMES } from '@/settings/data-model/conditional-logic/constants/ConditionalLogicExcludedFieldNames';
import {
  createConditionalLogicRuleDraft,
  removeConditionalLogicRule,
  upsertConditionalLogicRule,
} from '@/settings/data-model/conditional-logic/utils/conditionalLogicRuleDraft';
import { useSettingsPipelineActions } from '@/settings/data-model/pipelines/hooks/useSettingsPipelineActions';
import { DropdownInModalContext } from '@/ui/layout/dropdown/contexts/DropdownInModalContext';
import { useFullScreenModal } from '@/ui/layout/fullscreen/hooks/useFullScreenModal';

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

const StyledRuleCard = styled.div`
  align-items: center;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledRuleText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledRuleTitle = styled.div`
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledRuleActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

type SettingsPipelineStageConditionalLogicModalProps = {
  stage: PipelineStageConfig;
  objectNameSingular: string;
  isOpen: boolean;
  initialRuleDraft: ConditionalLogicRule | null;
  onClose: () => void;
};

export const SettingsPipelineStageConditionalLogicModal = ({
  stage,
  objectNameSingular,
  isOpen,
  initialRuleDraft,
  onClose,
}: SettingsPipelineStageConditionalLogicModalProps) => {
  const { t } = useLingui();
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });
  const { updatePipelineStage } = useSettingsPipelineActions();

  const [ruleDraft, setRuleDraft] = useState<ConditionalLogicRule | null>(
    initialRuleDraft,
  );
  const [isSaving, setIsSaving] = useState(false);
  // Opening straight on a new rule means cancelling it should close, not fall back to the list
  const [isOpenedOnDraft] = useState(isDefined(initialRuleDraft));

  const fieldMetadataItemByName = useMemo(
    () =>
      new Map(objectMetadataItem.fields.map((field) => [field.name, field])),
    [objectMetadataItem.fields],
  );

  const fields = useMemo(
    () =>
      buildConditionalLogicFields(objectMetadataItem.fields).filter(
        (field) => !CONDITIONAL_LOGIC_EXCLUDED_FIELD_NAMES.has(field.name),
      ),
    [objectMetadataItem.fields],
  );

  const stageFieldLabel =
    fieldMetadataItemByName.get('stage')?.label ?? t`Stage`;

  const fieldLabelOf = (fieldName: string) =>
    fieldMetadataItemByName.get(fieldName)?.label ?? fieldName;

  const saveRules = async (conditionalRules: ConditionalLogicRule[]) => {
    setIsSaving(true);
    const saved = await updatePipelineStage(stage.id, { conditionalRules });

    setIsSaving(false);

    return saved === true;
  };

  const handleSaveDraft = async () => {
    if (!isDefined(ruleDraft)) {
      return;
    }

    const saved = await saveRules(
      upsertConditionalLogicRule(stage.conditionalRules, ruleDraft),
    );

    if (saved) {
      setRuleDraft(null);

      if (isOpenedOnDraft) {
        onClose();
      }
    }
  };

  const handleCancelDraft = () => {
    setRuleDraft(null);

    if (isOpenedOnDraft) {
      onClose();
    }
  };

  const { renderFullScreenModal } = useFullScreenModal({
    links: [{ children: t`Conditional logic` }, { children: stage.label }],
    onClose,
  });

  const renderRuleList = () => (
    <StyledPanel>
      <StyledSectionTitle>{t`Rules for ${stage.label}`}</StyledSectionTitle>
      <StyledSectionDescription>
        {t`When a deal enters this stage and a rule's conditions are true, its properties are shown and required ones must be filled.`}
      </StyledSectionDescription>
      {stage.conditionalRules.map((rule, index) => {
        const ruleNumber = index + 1;
        const groupCount = rule.conditionGroups.filter(
          (group) => group.conditions.length > 0,
        ).length;
        const propertySummary = rule.properties
          .map((property) =>
            property.isRequired
              ? t`${fieldLabelOf(property.fieldName)} (required)`
              : fieldLabelOf(property.fieldName),
          )
          .join(', ');

        return (
          <StyledRuleCard key={rule.id}>
            <StyledRuleText>
              <StyledRuleTitle>{t`Rule ${ruleNumber}`}</StyledRuleTitle>
              <StyledSectionDescription>
                {groupCount === 0
                  ? t`Applies to every deal entering ${stage.label}`
                  : t`Applies when one of ${groupCount} condition groups is true`}
              </StyledSectionDescription>
              <StyledSectionDescription>
                {t`Shows: ${propertySummary}`}
              </StyledSectionDescription>
            </StyledRuleText>
            <StyledRuleActions>
              <LightIconButton
                aria-label={t`Edit rule ${ruleNumber}`}
                emphasis="subtle"
                onClick={() => setRuleDraft(rule)}
              >
                <IconPencil />
              </LightIconButton>
              <LightIconButton
                aria-label={t`Delete rule ${ruleNumber}`}
                emphasis="subtle"
                disabled={isSaving}
                onClick={() =>
                  saveRules(
                    removeConditionalLogicRule(stage.conditionalRules, rule.id),
                  )
                }
              >
                <IconTrash />
              </LightIconButton>
            </StyledRuleActions>
          </StyledRuleCard>
        );
      })}
      <LightButton
        startIcon={<IconPlus />}
        onClick={() => setRuleDraft(createConditionalLogicRuleDraft())}
      >
        {t`Add rule`}
      </LightButton>
    </StyledPanel>
  );

  const stageLabel = stage.label;

  const renderEditor = (draft: ConditionalLogicRule) => (
    <SettingsConditionalLogicRuleEditor
      draft={draft}
      onChange={setRuleDraft}
      onCancel={handleCancelDraft}
      onSave={handleSaveDraft}
      isSaving={isSaving}
      fields={fields}
      fieldMetadataItemByName={fieldMetadataItemByName}
      objectMetadataItem={objectMetadataItem}
      previewHint={t`Pick values to see what a deal moving to ${stageLabel} would be asked for.`}
      fixedConditionLabel={t`${stageFieldLabel} is equal to ${stageLabel}`}
    />
  );

  return renderFullScreenModal(
    <DropdownInModalContext.Provider value={true}>
      <div>
        {isDefined(ruleDraft) ? renderEditor(ruleDraft) : renderRuleList()}
      </div>
    </DropdownInModalContext.Provider>,
    isOpen,
  );
};
