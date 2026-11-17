import { type ActorFilterSubFieldName } from '@/object-record/object-filter-dropdown/constants/ActorFilterSubFields';
import { fieldMetadataItemUsedInDropdownComponentSelector } from '@/object-record/object-filter-dropdown/states/fieldMetadataItemUsedInDropdownComponentSelector';
import { SelectOptionIcon } from '@/ui/input/components/SelectOptionIcon';
import { SelectableListItem } from '@/ui/layout/selectable-list/components/SelectableListItem';
import { useSelectableList } from '@/ui/layout/selectable-list/hooks/useSelectableList';
import { isSelectedItemIdComponentFamilyState } from '@/ui/layout/selectable-list/states/isSelectedItemIdComponentFamilyState';
import { useAtomComponentFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyStateValue';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useInitializeFilterOnFieldMetadataItemFromViewBarFilterDropdown } from '@/views/hooks/useInitializeFilterOnFieldMetadataItemFromViewBarFilterDropdown';
import { getActorSubFieldSelectableItemId } from '@/views/utils/getActorSubFieldSelectableItemId';
import { type MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { ListItemButton } from 'twenty-ui/components/navigation';
import { useIcons } from 'twenty-ui/icon';

export type ViewBarFilterDropdownActorSubFieldSelectMenuItemProps = {
  subFieldName: ActorFilterSubFieldName;
  label: MessageDescriptor;
  iconName: string;
};

export const ViewBarFilterDropdownActorSubFieldSelectMenuItem = ({
  subFieldName,
  label,
  iconName,
}: ViewBarFilterDropdownActorSubFieldSelectMenuItemProps) => {
  const { t } = useLingui();
  const { getIcon } = useIcons();
  const { resetSelectedItem } = useSelectableList();

  const fieldMetadataItemUsedInDropdown = useAtomComponentSelectorValue(
    fieldMetadataItemUsedInDropdownComponentSelector,
  );

  const selectableItemId = getActorSubFieldSelectableItemId(subFieldName);

  const isSelectedItemId = useAtomComponentFamilyStateValue(
    isSelectedItemIdComponentFamilyState,
    selectableItemId,
  );

  const { initializeFilterOnFieldMetataItemFromViewBarFilterDropdown } =
    useInitializeFilterOnFieldMetadataItemFromViewBarFilterDropdown();

  const handleClick = () => {
    if (!isDefined(fieldMetadataItemUsedInDropdown)) {
      return;
    }

    resetSelectedItem();

    initializeFilterOnFieldMetataItemFromViewBarFilterDropdown(
      fieldMetadataItemUsedInDropdown,
      subFieldName,
    );
  };

  return (
    <SelectableListItem itemId={selectableItemId} onEnter={handleClick}>
      <ListItemButton
        focused={isSelectedItemId}
        onClick={handleClick}
        startIcon={<SelectOptionIcon Icon={getIcon(iconName)} />}
      >
        {t(label)}
      </ListItemButton>
    </SelectableListItem>
  );
};
