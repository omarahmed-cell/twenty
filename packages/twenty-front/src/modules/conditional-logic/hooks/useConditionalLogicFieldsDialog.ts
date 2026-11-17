import { CONDITIONAL_LOGIC_FIELDS_DIALOG_ID } from '@/conditional-logic/constants/ConditionalLogicFieldsDialogId';
import {
  type ConditionalLogicFieldsDialogRequest,
  conditionalLogicFieldsDialogRequestState,
  type ConditionalLogicFieldsDialogValues,
} from '@/conditional-logic/states/conditionalLogicFieldsDialogRequestState';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

// Resolves with the values the user filled, or null when they cancel
export const useConditionalLogicFieldsDialog = () => {
  const setConditionalLogicFieldsDialogRequest = useSetAtomState(
    conditionalLogicFieldsDialogRequestState,
  );
  const { openDialog } = useDialog();

  const askForConditionalLogicValues = (
    request: Omit<ConditionalLogicFieldsDialogRequest, 'resolve'>,
  ) =>
    new Promise<ConditionalLogicFieldsDialogValues | null>((resolve) => {
      setConditionalLogicFieldsDialogRequest({ ...request, resolve });
      openDialog(CONDITIONAL_LOGIC_FIELDS_DIALOG_ID);
    });

  return { askForConditionalLogicValues };
};
