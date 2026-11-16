import { styled } from '@linaria/react';
import { IconGripVertical } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

const StyledDragHandle = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.extraLight};
  cursor: grab;
  display: flex;
  height: 100%;
`;

export const SettingsPipelineDragHandle = () => {
  const theme = useTheme();

  return (
    <StyledDragHandle>
      <IconGripVertical
        size={theme.icon.size.md}
        stroke={theme.icon.stroke.sm}
      />
    </StyledDragHandle>
  );
};
