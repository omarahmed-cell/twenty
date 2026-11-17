import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

// Set by "Create property" on the Properties screen so the new-field flow presets the group and returns there
export type PropertyCreationContext = {
  objectMetadataId: string;
  propertyGroupId: string | null;
};

export const propertyCreationContextState =
  createAtomState<PropertyCreationContext | null>({
    key: 'propertyCreationContextState',
    defaultValue: null,
  });
