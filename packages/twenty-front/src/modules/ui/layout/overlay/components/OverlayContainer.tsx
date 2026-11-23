import { themeCssVariables } from 'twenty-ui/theme';
import { styled } from '@linaria/react';

// oxlint-disable-next-line twenty/styled-components-prefixed-with-styled
export const OverlayContainer = styled.div<{
  borderRadius?: 'sm' | 'md';
  hasDangerBorder?: boolean;
}>`
  align-items: center;
  backdrop-filter: ${themeCssVariables.blur.medium};

  background: ${themeCssVariables.background.transparent.primary};

  border: 1px solid
    ${({ hasDangerBorder }) =>
      themeCssVariables.border.color[hasDangerBorder ? 'danger' : 'medium']};

  border-radius: ${({ borderRadius }) =>
    borderRadius === 'sm' ? themeCssVariables.border.radius.sm : '12px'};
  box-shadow: ${themeCssVariables.boxShadow.strong};
  display: flex;

  overflow: hidden;

  z-index: 30;
`;
