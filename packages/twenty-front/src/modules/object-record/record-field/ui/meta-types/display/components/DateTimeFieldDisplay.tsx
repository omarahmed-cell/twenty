import { useDateTimeFieldDisplay } from '@/object-record/record-field/ui/meta-types/hooks/useDateTimeFieldDisplay';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { DateTimeDisplay } from '@/ui/field/display/components/DateTimeDisplay';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { styled } from '@linaria/react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledOverdueDueDate = styled.span`
  color: ${themeCssVariables.font.color.danger};
  display: contents;
`;

type TaskDueDateFieldDisplayProps = {
  recordId: string;
  children: React.ReactNode;
};

// Only task Due Date cells subscribe to the whole record to read Is Overdue
const TaskDueDateFieldDisplay = ({
  recordId,
  children,
}: TaskDueDateFieldDisplayProps) => {
  const recordStore = useAtomFamilyStateValue(recordStoreFamilyState, recordId);

  return recordStore?.isOverdue === true ? (
    <StyledOverdueDueDate>{children}</StyledOverdueDueDate>
  ) : (
    children
  );
};

export const DateTimeFieldDisplay = () => {
  const { fieldValue, fieldDefinition, recordId } = useDateTimeFieldDisplay();

  const dateFieldSettings = fieldDefinition.metadata?.settings;

  const display = (
    <DateTimeDisplay value={fieldValue} dateFieldSettings={dateFieldSettings} />
  );

  const isTaskDueDate =
    fieldDefinition.metadata.objectMetadataNameSingular ===
      CoreObjectNameSingular.Task &&
    fieldDefinition.metadata.fieldName === 'dueAt';

  return isTaskDueDate ? (
    <TaskDueDateFieldDisplay recordId={recordId}>
      {display}
    </TaskDueDateFieldDisplay>
  ) : (
    display
  );
};
