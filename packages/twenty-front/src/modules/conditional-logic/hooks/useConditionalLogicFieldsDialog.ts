import {
  type ConditionalLogicFieldsDialogRequest,
  conditionalLogicFieldsDialogRequestState,
  type ConditionalLogicFieldsDialogValues,
} from '@/conditional-logic/states/conditionalLogicFieldsDialogRequestState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

// Resolves with the values the user filled, or null when they cancel
export const useConditionalLogicFieldsDialog = () => {
  const setConditionalLogicFieldsDialogRequest = useSetAtomState(
    conditionalLogicFieldsDialogRequestState,
  );

  const askForConditionalLogicValues = (
    request: Omit<ConditionalLogicFieldsDialogRequest, 'resolve'>,
  ) =>
    new Promise<ConditionalLogicFieldsDialogValues | null>((resolve) => {
      setConditionalLogicFieldsDialogRequest({ ...request, resolve });
    });

  return { askForConditionalLogicValues };
};
