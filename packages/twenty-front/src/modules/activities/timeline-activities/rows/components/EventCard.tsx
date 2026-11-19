import { styled } from '@linaria/react';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme';

type EventCardProps = {
  children: React.ReactNode;
  isOpen: boolean;
  isFullWidth?: boolean;
};

const StyledCardContainer = styled.div<{ isFullWidth: boolean }>`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: ${themeCssVariables.spacing[2]};
  max-width: ${({ isFullWidth }) => (isFullWidth ? 'none' : '400px')};
  padding: ${themeCssVariables.spacing[2]} 0px ${themeCssVariables.spacing[1]}
    0px;
  width: 100%;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    max-width: ${({ isFullWidth }) => (isFullWidth ? 'none' : '300px')};
  }
`;

const StyledCardInnerContainer = styled.div`
  align-items: flex-start;
  align-self: stretch;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: center;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[2]};
`;

export const EventCard = ({
  children,
  isOpen,
  isFullWidth = false,
}: EventCardProps) => {
  return (
    isOpen && (
      <StyledCardContainer isFullWidth={isFullWidth}>
        {isFullWidth ? (
          children
        ) : (
          <StyledCardInnerContainer>{children}</StyledCardInnerContainer>
        )}
      </StyledCardContainer>
    )
  );
};
