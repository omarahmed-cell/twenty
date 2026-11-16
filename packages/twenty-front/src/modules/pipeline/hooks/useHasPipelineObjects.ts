import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { CoreObjectNameSingular } from 'twenty-shared/types';

// Record hooks throw on objects missing from metadata, so pipeline readers mount only once the upgrade added them
export const useHasPipelineObjects = () => {
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);

  return [
    CoreObjectNameSingular.Pipeline,
    CoreObjectNameSingular.PipelineStage,
  ].every((nameSingular) =>
    objectMetadataItems.some(
      (objectMetadataItem) => objectMetadataItem.nameSingular === nameSingular,
    ),
  );
};
