import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';

import { usePipelineBoardRememberedPipelineKey } from '@/pipeline/board/hooks/usePipelineBoardRememberedPipelineKey';
import { usePipelineBoardScope } from '@/pipeline/board/hooks/usePipelineBoardScope';
import { usePipelineConfigs } from '@/pipeline/hooks/usePipelineConfigs';
import { Select } from '@/ui/input/components/Select';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[2]}
    ${themeCssVariables.spacing[1]} 0;
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

type PipelineBoardSwitcherProps = {
  recordBoardId: string;
  objectNameSingular: string;
};

export const PipelineBoardSwitcher = ({
  recordBoardId,
  objectNameSingular,
}: PipelineBoardSwitcherProps) => {
  const { pipelines } = usePipelineConfigs({ objectNameSingular });
  const pipelineBoardScope = usePipelineBoardScope();
  const { rememberPipelineKey } = usePipelineBoardRememberedPipelineKey({
    objectNameSingular,
  });

  if (pipelines.length === 0) {
    return null;
  }

  return (
    <StyledContainer>
      <StyledLabel>{t`Pipeline`}</StyledLabel>
      <Select
        dropdownId={`pipeline-board-switcher-${recordBoardId}`}
        value={pipelineBoardScope?.pipelineKey}
        options={pipelines.map((pipeline) => ({
          label: pipeline.name,
          value: pipeline.key,
        }))}
        selectSizeVariant="small"
        dropdownWidthAuto
        withSearchInput={pipelines.length > 8}
        onChange={rememberPipelineKey}
      />
    </StyledContainer>
  );
};
