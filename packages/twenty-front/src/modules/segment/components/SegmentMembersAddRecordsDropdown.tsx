import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { MultipleRecordPicker } from '@/object-record/record-picker/multiple-record-picker/components/MultipleRecordPicker';
import { useMultipleRecordPickerOpen } from '@/object-record/record-picker/multiple-record-picker/hooks/useMultipleRecordPickerOpen';
import { useMultipleRecordPickerPerformSearch } from '@/object-record/record-picker/multiple-record-picker/hooks/useMultipleRecordPickerPerformSearch';
import { multipleRecordPickerPickableMorphItemsComponentState } from '@/object-record/record-picker/multiple-record-picker/states/multipleRecordPickerPickableMorphItemsComponentState';
import { multipleRecordPickerSearchableObjectMetadataItemsComponentState } from '@/object-record/record-picker/multiple-record-picker/states/multipleRecordPickerSearchableObjectMetadataItemsComponentState';
import { upsertMorphItem } from '@/object-record/record-picker/multiple-record-picker/utils/upsertMorphItem';
import { type RecordPickerPickableMorphItem } from '@/object-record/record-picker/types/RecordPickerPickableMorphItem';
import { useUpdateSegmentMembership } from '@/side-panel/pages/segment-membership/hooks/useUpdateSegmentMembership';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { t } from '@lingui/core/macro';
import { useStore } from 'jotai';
import { isNonEmptyArray } from 'twenty-shared/utils';
import { IconPlus } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

type SegmentMembersAddRecordsDropdownProps = {
  segmentId: string;
  objectMetadataItem: EnrichedObjectMetadataItem;
  onMembersChanged: () => void;
};

export const SegmentMembersAddRecordsDropdown = ({
  segmentId,
  objectMetadataItem,
  onMembersChanged,
}: SegmentMembersAddRecordsDropdownProps) => {
  const dropdownId = `segment-members-add-${segmentId}`;

  const store = useStore();
  const { closeDropdown } = useCloseDropdown();
  const { openMultipleRecordPicker } = useMultipleRecordPickerOpen();
  const { performSearch } = useMultipleRecordPickerPerformSearch();

  const { updateSegmentMembership, isUpdating } = useUpdateSegmentMembership({
    onCompleted: onMembersChanged,
  });

  const pickableMorphItemsAtom =
    multipleRecordPickerPickableMorphItemsComponentState.atomFamily({
      instanceId: dropdownId,
    });

  const handleOpen = () => {
    openMultipleRecordPicker(dropdownId);

    store.set(pickableMorphItemsAtom, []);
    store.set(
      multipleRecordPickerSearchableObjectMetadataItemsComponentState.atomFamily(
        { instanceId: dropdownId },
      ),
      [objectMetadataItem],
    );

    performSearch({
      multipleRecordPickerInstanceId: dropdownId,
      forceSearchFilter: '',
      forceSearchableObjectMetadataItems: [objectMetadataItem],
      forcePickableMorphItems: [],
    });
  };

  const handleChange = (morphItem: RecordPickerPickableMorphItem) => {
    store.set(
      pickableMorphItemsAtom,
      upsertMorphItem(store.get(pickableMorphItemsAtom), morphItem),
    );
  };

  const handleCloseAndAdd = () => {
    closeDropdown(dropdownId);

    const pickedRecordIds = store
      .get(pickableMorphItemsAtom)
      .filter((morphItem) => morphItem.isSelected)
      .map((morphItem) => morphItem.recordId);

    if (!isNonEmptyArray(pickedRecordIds)) {
      return;
    }

    void updateSegmentMembership({
      segmentId,
      request: {
        operation: 'ADD',
        objectNameSingular: objectMetadataItem.nameSingular,
        recordFilter: { id: { in: pickedRecordIds } },
      },
    });
  };

  const objectLabelPlural = objectMetadataItem.labelPlural;

  return (
    <Dropdown
      dropdownId={dropdownId}
      dropdownPlacement="bottom-start"
      onOpen={handleOpen}
      clickableComponent={
        <Button
          size="sm"
          variant="outline"
          startIcon={<IconPlus />}
          loading={isUpdating}
          disabled={isUpdating}
        >{t`Add ${objectLabelPlural}`}</Button>
      }
      dropdownComponents={
        <MultipleRecordPicker
          componentInstanceId={dropdownId}
          focusId={dropdownId}
          layoutDirection="search-bar-on-top"
          onChange={handleChange}
          onSubmit={handleCloseAndAdd}
          onClickOutside={handleCloseAndAdd}
          dropdownWidth={GenericDropdownContentWidth.ExtraLarge}
        />
      }
    />
  );
};
