import { styled } from '@linaria/react';

import { useDealRecordLock } from '@/pipeline/rules/hooks/useDealRecordLock';
import { IconInfoCircle } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledNote = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]} 0;
`;

type DealRecordLockNoteProps = {
  objectNameSingular: string;
  recordId: string;
};

export const DealRecordLockNote = ({
  objectNameSingular,
  recordId,
}: DealRecordLockNoteProps) => {
  const { isLocked, lockReason } = useDealRecordLock({
    objectNameSingular,
    recordId,
  });

  if (!isLocked) {
    return null;
  }

  return (
    <StyledNote>
      <IconInfoCircle size={14} />
      {lockReason}
    </StyledNote>
  );
};
