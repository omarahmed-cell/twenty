import { type RecordPagePanelSide } from '@/page-layout/types/RecordPagePanelSide';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconChevronLeft, IconChevronRight } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledRail = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  height: 100%;
  padding: ${themeCssVariables.spacing[3]} 0;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: -2px;
  }
`;

const StyledRailLabel = styled.span`
  font-size: 11px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  writing-mode: vertical-rl;
`;

type RecordPagePanelRailProps = {
  side: RecordPagePanelSide;
  title: string;
  onExpand: () => void;
};

export const RecordPagePanelRail = ({
  side,
  title,
  onExpand,
}: RecordPagePanelRailProps) => {
  const { t } = useLingui();

  return (
    <StyledRail
      type="button"
      aria-label={t`Show ${title} panel`}
      onClick={onExpand}
    >
      {side === 'left' ? (
        <IconChevronRight size={16} />
      ) : (
        <IconChevronLeft size={16} />
      )}
      <StyledRailLabel aria-hidden>{title}</StyledRailLabel>
    </StyledRail>
  );
};
