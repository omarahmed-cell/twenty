import { styled } from '@linaria/react';
import { plural } from '@lingui/core/macro';
import { countStageCalculatedProperties } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';

const StyledSummary = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
`;

type SettingsPipelineCalcPropsSummaryProps = {
  pipeline: PipelineConfig;
};

export const SettingsPipelineCalcPropsSummary = ({
  pipeline,
}: SettingsPipelineCalcPropsSummaryProps) => {
  const enabledCount = countStageCalculatedProperties(pipeline.stages);

  return (
    <StyledSummary>
      {plural(enabledCount, {
        one: `${enabledCount} stage calculated property enabled`,
        other: `${enabledCount} stage calculated properties enabled`,
      })}
    </StyledSummary>
  );
};
