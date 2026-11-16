import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { type PipelineRules } from 'twenty-shared/utils';
import { Callout } from 'twenty-ui/components/feedback';
import { Section } from 'twenty-ui/components/layout';
import { IconInfoCircle } from 'twenty-ui/icon';
import { Button, Switch } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import { SettingsPipelineRuleStagesPicker } from '@/settings/data-model/pipelines/components/SettingsPipelineRuleStagesPicker';
import { useSettingsPipelineActions } from '@/settings/data-model/pipelines/hooks/useSettingsPipelineActions';
import {
  keepExistingRuleStages,
  type PipelineBooleanRuleKey,
  type PipelineStageListRuleKey,
  setPipelineRuleEnabled,
  togglePipelineRuleStage,
} from '@/settings/data-model/pipelines/utils/updatePipelineRules';

const StyledRules = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledRuleRow = styled.div`
  align-items: center;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledRuleText = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledRuleTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledRuleDescription = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledStagesPickerContainer = styled.div`
  width: 220px;
`;

const StyledFooter = styled.div`
  display: flex;
  justify-content: flex-end;
`;

type RuleDefinition =
  | {
      key: PipelineStageListRuleKey;
      title: string;
      description: string;
      takesStages: true;
    }
  | {
      key: PipelineBooleanRuleKey;
      title: string;
      description: string;
      takesStages: false;
    };

const isRuleEnabled = (rules: PipelineRules, rule: RuleDefinition) =>
  rule.takesStages ? rules[rule.key].enabled : rules[rule.key];

type SettingsPipelineRulesSectionProps = {
  pipeline: PipelineConfig;
};

export const SettingsPipelineRulesSection = ({
  pipeline,
}: SettingsPipelineRulesSectionProps) => {
  const { t } = useLingui();
  const { updatePipeline } = useSettingsPipelineActions();

  const stageValues = pipeline.stages.map(({ value }) => value);
  const savedRules = keepExistingRuleStages({
    rules: pipeline.rules,
    stageValues,
  });

  const [draftRules, setDraftRules] = useState<PipelineRules>(savedRules);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = JSON.stringify(draftRules) !== JSON.stringify(savedRules);

  const ruleDefinitions: RuleDefinition[] = [
    {
      key: 'limitCreationToStages',
      title: t`Limit deal creation to stages`,
      description: t`New deals can only be created in the chosen stages.`,
      takesStages: true,
    },
    {
      key: 'restrictSkipping',
      title: t`Restrict skipping stages`,
      description: t`Deals must move through every stage in order.`,
      takesStages: false,
    },
    {
      key: 'restrictBackward',
      title: t`Restrict moving backward`,
      description: t`Deals cannot move back to an earlier stage.`,
      takesStages: false,
    },
    {
      key: 'lockEditingInStages',
      title: t`Lock editing in stages`,
      description: t`Deals in the chosen stages cannot be edited.`,
      takesStages: true,
    },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await updatePipeline(pipeline.id, { rules: draftRules });
    setIsSaving(false);
  };

  return (
    <Section.Root>
      <Section.Header
        title={t`Pipeline rules`}
        description={t`Rules stored for this pipeline. They are all off by default.`}
      />
      <StyledRules>
        <Callout
          status="info"
          icon={
            <IconInfoCircle
              size={themeCssVariables.icon.size.md}
              aria-hidden="true"
            />
          }
          title={t`Not enforced yet`}
          description={t`These settings are saved now and will be enforced in a later phase.`}
        />
        {ruleDefinitions.map((rule) => {
          const enabled = isRuleEnabled(draftRules, rule);

          return (
            <StyledRuleRow key={rule.key}>
              <Switch
                checked={enabled}
                size="sm"
                aria-label={rule.title}
                onCheckedChange={(checked: boolean) =>
                  setDraftRules(
                    setPipelineRuleEnabled({
                      rules: draftRules,
                      ruleKey: rule.key,
                      enabled: checked,
                    }),
                  )
                }
              />
              <StyledRuleText>
                <StyledRuleTitle>{rule.title}</StyledRuleTitle>
                <StyledRuleDescription>
                  {rule.description}
                </StyledRuleDescription>
              </StyledRuleText>
              {rule.takesStages && (
                <StyledStagesPickerContainer>
                  <SettingsPipelineRuleStagesPicker
                    dropdownId={`settings-pipeline-rule-${rule.key}-${pipeline.id}`}
                    stages={pipeline.stages}
                    selectedStageValues={draftRules[rule.key].stageValues}
                    isDisabled={!enabled}
                    onToggleStage={(stageValue) =>
                      setDraftRules(
                        togglePipelineRuleStage({
                          rules: draftRules,
                          ruleKey: rule.key,
                          stageValue,
                        }),
                      )
                    }
                  />
                </StyledStagesPickerContainer>
              )}
            </StyledRuleRow>
          );
        })}
        <StyledFooter>
          <Button
            size="sm"
            variant="solid"
            color="accent"
            disabled={!isDirty || isSaving}
            onClick={handleSave}
          >
            {t`Save rules`}
          </Button>
        </StyledFooter>
      </StyledRules>
    </Section.Root>
  );
};
