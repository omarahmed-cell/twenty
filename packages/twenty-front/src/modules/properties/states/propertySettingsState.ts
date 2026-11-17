import { type PropertySettings } from '@/properties/types/PropertySettings';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const propertySettingsState = createAtomState<PropertySettings | null>({
  key: 'propertySettingsState',
  defaultValue: null,
});
