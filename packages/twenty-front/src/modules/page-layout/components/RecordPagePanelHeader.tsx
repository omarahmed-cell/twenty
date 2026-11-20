import { type RecordPagePanelSide } from '@/page-layout/types/RecordPagePanelSide';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconButton } from 'twenty-ui/components/input';
import { IconChevronLeft, IconChevronRight } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  min-height: ${themeCssVariables.spacing[10]};
  padding: 0 ${themeCssVariables.spacing[2]} 0 ${themeCssVariables.spacing[4]};
`;

const StyledTitle = styled.h2`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 11px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.06em;
  margin: 0;
  text-transform: uppercase;
`;

type RecordPagePanelHeaderProps = {
  side: RecordPagePanelSide;
  title: string;
  onCollapse: () => void;
};

export const RecordPagePanelHeader = ({
  side,
  title,
  onCollapse,
}: RecordPagePanelHeaderProps) => {
  const { t } = useLingui();

  return (
    <StyledHeader>
      <StyledTitle>{title}</StyledTitle>
      <IconButton
        aria-label={t`Collapse ${title} panel`}
        onClick={onCollapse}
        size="sm"
        variant="ghost"
      >
        {side === 'left' ? <IconChevronLeft /> : <IconChevronRight />}
      </IconButton>
    </StyledHeader>
  );
};
