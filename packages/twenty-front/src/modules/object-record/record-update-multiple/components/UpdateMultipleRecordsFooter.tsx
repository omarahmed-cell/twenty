import { computeProgressText } from '@/command-menu-item/utils/computeProgressText';
import { type ObjectRecordQueryProgress } from '@/object-record/types/ObjectRecordQueryProgress';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme';

import { IconBoxMultiple } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

const StyledFooterContainer = styled.div`
  align-items: flex-end;
  background: ${themeCssVariables.background.primary};
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledFooterActions = styled.div`
  align-items: flex-end;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

type UpdateMultipleRecordsFooterProps = {
  isUpdating: boolean;
  progress?: ObjectRecordQueryProgress;
  onUpdate: () => void;
  onCancel: () => void;
  isUpdateDisabled?: boolean;
};

export const UpdateMultipleRecordsFooter = ({
  isUpdating,
  progress,
  onUpdate,
  onCancel,
  isUpdateDisabled,
}: UpdateMultipleRecordsFooterProps) => {
  const { t } = useLingui();
  const progressText = computeProgressText(progress);

  return (
    <StyledFooterContainer>
      <StyledFooterActions>
        <Button
          size="sm"
          onClick={onCancel}
          variant="outline"
        >{t`Cancel`}</Button>
        <Button
          size="sm"
          startIcon={<IconBoxMultiple />}
          loading={isUpdating && !progressText}
          onClick={onUpdate}
          disabled={isUpdating || isUpdateDisabled}
          variant="solid"
          color="accent"
        >
          {isUpdating ? t`Apply${progressText}` : t`Apply`}
        </Button>
      </StyledFooterActions>
    </StyledFooterContainer>
  );
};
