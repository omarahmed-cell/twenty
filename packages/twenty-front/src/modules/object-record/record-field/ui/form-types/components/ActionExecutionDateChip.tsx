import { BaseChip } from '@/ui/input/components/BaseChip';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconClockPlay } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  margin-left: ${themeCssVariables.spacing[2]};
`;

type ActionExecutionDateChipProps = {
  onRemove?: () => void;
};

export const ActionExecutionDateChip = ({
  onRemove,
}: ActionExecutionDateChipProps) => {
  const { t } = useLingui();
  const theme = useTheme();

  return (
    <StyledContainer>
      <BaseChip
        label={t`Date the action was executed`}
        onRemove={onRemove}
        removeAriaLabel={t`Remove date the action was executed`}
        leftIcon={
          <IconClockPlay
            size={theme.icon.size.sm}
            stroke={theme.icon.stroke.sm}
          />
        }
      />
    </StyledContainer>
  );
};
