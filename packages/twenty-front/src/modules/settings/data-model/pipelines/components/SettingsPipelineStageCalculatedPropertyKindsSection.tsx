import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import {
  STAGE_CALCULATED_PROPERTY_KINDS,
  type StageCalculatedPropertyKind,
} from 'twenty-shared/utils';
import { Section } from 'twenty-ui/components/layout';
import { Checkbox } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import { STAGE_CALCULATED_PROPERTY_KIND_LABELS } from '@/settings/data-model/pipelines/constants/StageCalculatedPropertyKindLabels';
import { useSettingsPipelineActions } from '@/settings/data-model/pipelines/hooks/useSettingsPipelineActions';

const StyledOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledOption = styled.label`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

type SettingsPipelineStageCalculatedPropertyKindsSectionProps = {
  pipeline: PipelineConfig;
};

export const SettingsPipelineStageCalculatedPropertyKindsSection = ({
  pipeline,
}: SettingsPipelineStageCalculatedPropertyKindsSectionProps) => {
  const { t } = useLingui();
  const { setPipelineStageCalculatedPropertyKinds } =
    useSettingsPipelineActions();
  const [isSaving, setIsSaving] = useState(false);

  const checkedKinds = pipeline.stageCalculatedPropertyKinds;

  const handleToggleKind = async (
    kind: StageCalculatedPropertyKind,
    isChecked: boolean,
  ) => {
    const nextKinds = STAGE_CALCULATED_PROPERTY_KINDS.filter((candidate) =>
      candidate === kind ? isChecked : checkedKinds.includes(candidate),
    );

    setIsSaving(true);
    await setPipelineStageCalculatedPropertyKinds(pipeline.id, nextKinds);
    setIsSaving(false);
  };

  return (
    <Section.Root>
      <Section.Header
        title={t`Stage fields to generate`}
        description={t`Fields created for each stage that has stage calculated properties turned on.`}
      />
      <StyledOptions>
        {STAGE_CALCULATED_PROPERTY_KINDS.map((kind) => {
          const isChecked = checkedKinds.includes(kind);
          // Unchecking every kind would leave the stage toggles creating nothing
          const isLastChecked = isChecked && checkedKinds.length === 1;

          return (
            <StyledOption key={kind}>
              <Checkbox
                checked={isChecked}
                disabled={isSaving || isLastChecked}
                onCheckedChange={(nextChecked: boolean) =>
                  void handleToggleKind(kind, nextChecked)
                }
                size="sm"
              />
              {t(STAGE_CALCULATED_PROPERTY_KIND_LABELS[kind])}
            </StyledOption>
          );
        })}
      </StyledOptions>
    </Section.Root>
  );
};
