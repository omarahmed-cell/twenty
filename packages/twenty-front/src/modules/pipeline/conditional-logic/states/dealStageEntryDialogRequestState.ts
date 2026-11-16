import { type DealStageEntryRequirement } from '@/pipeline/conditional-logic/utils/getDealStageEntryRequirement';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type DealStageEntryValues = Record<string, unknown>;

export type DealStageEntryDialogRequest = {
  requirement: DealStageEntryRequirement;
  record: Record<string, unknown>;
  resolve: (values: DealStageEntryValues | null) => void;
};

export const dealStageEntryDialogRequestState =
  createAtomState<DealStageEntryDialogRequest | null>({
    key: 'dealStageEntryDialogRequestState',
    defaultValue: null,
  });
