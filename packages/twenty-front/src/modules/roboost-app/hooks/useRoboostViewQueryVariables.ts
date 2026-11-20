import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { flattenedFieldMetadataItemsSelector } from '@/object-metadata/states/flattenedFieldMetadataItemsSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFilterValueDependencies } from '@/object-record/record-filter/hooks/useFilterValueDependencies';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { type View } from '@/views/types/View';
import { getQueryVariablesFromFiltersAndSorts } from '@/views/utils/getQueryVariablesFromFiltersAndSorts';
import { mapViewFilterGroupsToRecordFilterGroups } from '@/views/utils/mapViewFilterGroupsToRecordFilterGroups';
import { mapViewFiltersToFilters } from '@/views/utils/mapViewFiltersToFilters';

// The saved view's own filters and sorts, computed the same way the classic table does
export const useRoboostViewQueryVariables = ({
  view,
  objectMetadataItem,
}: {
  view: View | undefined;
  objectMetadataItem: EnrichedObjectMetadataItem;
}) => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const flattenedFieldMetadataItems = useAtomStateValue(
    flattenedFieldMetadataItemsSelector,
  );
  const { filterValueDependencies } = useFilterValueDependencies();

  return getQueryVariablesFromFiltersAndSorts({
    recordFilters: mapViewFiltersToFilters(
      view?.viewFilters ?? [],
      flattenedFieldMetadataItems,
    ),
    recordFilterGroups: mapViewFilterGroupsToRecordFilterGroups(
      view?.viewFilterGroups ?? [],
    ),
    recordSorts: (view?.viewSorts ?? []).map(
      ({ viewId: _viewId, ...recordSort }) => recordSort,
    ),
    objectMetadataItem,
    objectMetadataItems,
    fieldMetadataItems: flattenedFieldMetadataItems,
    filterValueDependencies,
  });
};
