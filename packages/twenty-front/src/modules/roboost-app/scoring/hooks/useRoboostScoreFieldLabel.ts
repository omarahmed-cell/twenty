import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { isDefined } from 'twenty-shared/utils';

// Labels of score properties, read from the metadata the app already holds
export const useRoboostScoreFieldLabel = () => {
  const { objectMetadataItems } = useObjectMetadataItems();

  return (objectName: string, fieldMetadataId: string | null) => {
    if (!isDefined(fieldMetadataId)) {
      return null;
    }
    const field = objectMetadataItems
      .find((item) => item.nameSingular === objectName)
      ?.fields.find((candidate) => candidate.id === fieldMetadataId);

    return field?.label ?? null;
  };
};
