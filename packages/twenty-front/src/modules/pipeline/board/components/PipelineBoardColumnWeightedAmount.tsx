import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';

import { usePipelineBoardScope } from '@/pipeline/board/hooks/usePipelineBoardScope';
import { pipelineBoardWeightedAmountDisplayValueComponentFamilyState } from '@/pipeline/board/states/pipelineBoardWeightedAmountDisplayValueComponentFamilyState';
import { useAtomComponentFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyStateValue';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledWeightedAmount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  white-space: nowrap;
`;

type PipelineBoardColumnWeightedAmountProps = {
  stageValue: string | null;
};

export const PipelineBoardColumnWeightedAmount = ({
  stageValue,
}: PipelineBoardColumnWeightedAmountProps) => {
  const pipelineBoardScope = usePipelineBoardScope();

  const pipelineBoardWeightedAmountDisplayValue =
    useAtomComponentFamilyStateValue(
      pipelineBoardWeightedAmountDisplayValueComponentFamilyState,
      { stageValue: stageValue ?? '' },
    );

  if (
    !isDefined(pipelineBoardScope) ||
    !isDefined(pipelineBoardWeightedAmountDisplayValue)
  ) {
    return null;
  }

  return (
    <StyledWeightedAmount>{t`Weighted ${pipelineBoardWeightedAmountDisplayValue}`}</StyledWeightedAmount>
  );
};
