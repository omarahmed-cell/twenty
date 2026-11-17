import {
  type ConditionalLogicProperty,
  type ConditionalLogicRule,
} from 'twenty-shared/utils';

import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type ConditionalLogicFieldsDialogValues = Record<string, unknown>;

export type ConditionalLogicFieldsDialogRequest = {
  objectNameSingular: string;
  title: string;
  confirmLabel: string;
  hint: string;
  properties: ConditionalLogicProperty[];
  // Missing required fields are rechecked against these rules as the user fills the form
  rules: ConditionalLogicRule[];
  record: Record<string, unknown>;
  // The pending change that triggered the dialog, applied on top of the record
  recordOverrides: Record<string, unknown>;
  resolve: (values: ConditionalLogicFieldsDialogValues | null) => void;
};

export const conditionalLogicFieldsDialogRequestState =
  createAtomState<ConditionalLogicFieldsDialogRequest | null>({
    key: 'conditionalLogicFieldsDialogRequestState',
    defaultValue: null,
  });
