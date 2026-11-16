import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import {
  countPipelineRulesForStage,
  type PipelineRules,
} from 'twenty-shared/utils';
import { LightButton, LightIconButton } from 'twenty-ui/components/input';
import { IconPlus, IconTrash } from 'twenty-ui/icon';
import { Switch } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { type PipelineStageConfig } from '@/pipeline/types/PipelineConfig';
import { SettingsPipelineDragHandle } from '@/settings/data-model/pipelines/components/SettingsPipelineDragHandle';
import { SettingsPipelineStageColorPicker } from '@/settings/data-model/pipelines/components/SettingsPipelineStageColorPicker';
import { SettingsPipelineStageProbabilityPicker } from '@/settings/data-model/pipelines/components/SettingsPipelineStageProbabilityPicker';
import { SETTINGS_PIPELINE_STAGES_TABLE_GRID_TEMPLATE_COLUMNS } from '@/settings/data-model/pipelines/constants/SettingsPipelineStagesTableGridTemplateColumns';
import { useSettingsPipelineDealCount } from '@/settings/data-model/pipelines/hooks/useSettingsPipelineDealCount';
import { getDealsInUseBlockedMessage } from '@/settings/data-model/pipelines/utils/getDealsInUseBlockedMessage';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const StyledLabelInputContainer = styled.div`
  flex: 1;
  min-width: 0;

  & input {
    height: ${themeCssVariables.spacing[6]};
  }
`;

const StyledConditionalLogic = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledRuleCountButton = styled.button`
  background: none;
  border: none;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  padding: 0;
  text-decoration: underline;
`;

const StyledDisabledHint = styled.span`
  display: inline-flex;
`;

type SettingsPipelineStageRowProps = {
  stage: PipelineStageConfig;
  rules: PipelineRules;
  isOnlyStage: boolean;
  onUpdate: (
    input: Partial<
      Pick<PipelineStageConfig, 'label' | 'color' | 'probability'>
    >,
  ) => void;
  onDelete: () => void;
  onOpenConditionalLogic: (options: { isNewRule: boolean }) => void;
  isCalcPropsSaving: boolean;
  onToggleCalcProps: (isEnabled: boolean) => void;
};

export const SettingsPipelineStageRow = ({
  stage,
  rules,
  isOnlyStage,
  onUpdate,
  onDelete,
  onOpenConditionalLogic,
  isCalcPropsSaving,
  onToggleCalcProps,
}: SettingsPipelineStageRowProps) => {
  const { t } = useLingui();
  const [labelDraft, setLabelDraft] = useState(stage.label);
  const conditionalRuleCount = stage.conditionalRules.length;

  const dealCount = useSettingsPipelineDealCount({
    fieldName: 'stage',
    value: stage.value,
  });

  const deleteBlockedMessage = isOnlyStage
    ? t`A pipeline needs at least one stage.`
    : getDealsInUseBlockedMessage({ dealCount, kind: 'stage' });

  const saveLabel = () => {
    const trimmedLabel = labelDraft.trim();

    if (trimmedLabel === '') {
      setLabelDraft(stage.label);

      return;
    }

    if (trimmedLabel !== stage.label) {
      onUpdate({ label: trimmedLabel });
    }
  };

  return (
    <TableRow
      gridTemplateColumns={SETTINGS_PIPELINE_STAGES_TABLE_GRID_TEMPLATE_COLUMNS}
    >
      <TableCell padding="0">
        <SettingsPipelineDragHandle />
      </TableCell>
      <TableCell padding="0" align="center">
        <SettingsPipelineStageColorPicker
          stageId={stage.id}
          color={stage.color}
          onChange={(color) => onUpdate({ color })}
        />
      </TableCell>
      <TableCell minWidth="0">
        <StyledLabelInputContainer>
          <SettingsTextInput
            instanceId={`settings-pipeline-stage-label-${stage.id}`}
            value={labelDraft}
            onChange={setLabelDraft}
            onBlur={saveLabel}
            onInputEnter={saveLabel}
            fullWidth
          />
        </StyledLabelInputContainer>
      </TableCell>
      <TableCell>
        <SettingsPipelineStageProbabilityPicker
          stageId={stage.id}
          probability={stage.probability}
          onChange={(probability) => onUpdate({ probability })}
        />
      </TableCell>
      <TableCell>
        <StyledConditionalLogic>
          {conditionalRuleCount === 0 ? (
            '—'
          ) : (
            <StyledRuleCountButton
              type="button"
              onClick={() => onOpenConditionalLogic({ isNewRule: false })}
            >
              {conditionalRuleCount === 1
                ? t`1 logic rule`
                : t`${conditionalRuleCount} logic rules`}
            </StyledRuleCountButton>
          )}
          <LightButton
            startIcon={<IconPlus />}
            onClick={() => onOpenConditionalLogic({ isNewRule: true })}
          >
            {t`Add rule`}
          </LightButton>
        </StyledConditionalLogic>
      </TableCell>
      <TableCell align="right">
        {countPipelineRulesForStage(rules, stage.value)}
      </TableCell>
      <TableCell align="center">
        <Switch
          checked={stage.calcPropsEnabled}
          disabled={isCalcPropsSaving}
          onCheckedChange={(isEnabled) => onToggleCalcProps(isEnabled)}
          size="sm"
          aria-label={t`Stage calculated properties`}
        />
      </TableCell>
      <TableCell align="right" padding="0">
        <StyledDisabledHint title={deleteBlockedMessage ?? undefined}>
          <LightIconButton
            aria-label={t`Delete stage`}
            emphasis="subtle"
            disabled={deleteBlockedMessage !== null}
            onClick={onDelete}
          >
            <IconTrash />
          </LightIconButton>
        </StyledDisabledHint>
      </TableCell>
    </TableRow>
  );
};
