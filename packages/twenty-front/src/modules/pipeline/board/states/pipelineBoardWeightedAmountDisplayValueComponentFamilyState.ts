import { ContextStoreComponentInstanceContext } from '@/context-store/states/contexts/ContextStoreComponentInstanceContext';
import { createAtomComponentFamilyState } from '@/ui/utilities/state/jotai/utils/createAtomComponentFamilyState';

export const pipelineBoardWeightedAmountDisplayValueComponentFamilyState =
  createAtomComponentFamilyState<string | null, { stageValue: string }>({
    key: 'pipelineBoardWeightedAmountDisplayValueComponentFamilyState',
    defaultValue: null,
    componentInstanceContext: ContextStoreComponentInstanceContext,
  });
