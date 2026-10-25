import { CARD_ACTION_CLASS_NAME } from '@/ui/layout/card/styles/CardActionClassName';
import { styled } from '@linaria/react';
import { type MouseEvent, type PropsWithChildren } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { Card } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledRowContentContainer = styled.div`
  > div:has(> .${CARD_ACTION_CLASS_NAME}:not(:disabled)):hover {
    background: ${themeCssVariables.background.transparent.lighter};
    cursor: pointer;
  }
`;

const StyledRowContent = styled(Card.Content)`
  padding: ${themeCssVariables.spacing[0]} ${themeCssVariables.spacing[4]};
  position: relative;
`;

// Card.Content's own class wins over a styled override, so the row layout lives on an inner element
const StyledRowLayout = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  min-height: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledRowAction = styled.button`
  &:disabled {
    cursor: default;
    pointer-events: none;
  }
`;

const INDEPENDENT_ROW_ACTION_SELECTOR = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="link"]',
  '[role="switch"]',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ');

type ActivityRowProps = PropsWithChildren<{
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
  label: string;
}>;

export const ActivityRow = ({
  children,
  onClick,
  disabled,
  divider = false,
  label,
}: ActivityRowProps) => {
  const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;

    if (
      disabled ||
      event.defaultPrevented ||
      !(target instanceof Element) ||
      isDefined(target.closest(INDEPENDENT_ROW_ACTION_SELECTOR))
    ) {
      return;
    }

    onClick?.();
  };

  return (
    <StyledRowContentContainer>
      <StyledRowContent divider={divider} onClick={handleContentClick}>
        {isDefined(onClick) && (
          <StyledRowAction
            className={CARD_ACTION_CLASS_NAME}
            type="button"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
          />
        )}
        <StyledRowLayout>{children}</StyledRowLayout>
      </StyledRowContent>
    </StyledRowContentContainer>
  );
};
