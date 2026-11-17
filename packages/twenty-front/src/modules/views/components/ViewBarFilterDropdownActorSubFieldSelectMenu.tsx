import { ACTOR_FILTER_SUB_FIELDS } from '@/object-record/object-filter-dropdown/constants/ActorFilterSubFields';
import { useResetFilterDropdown } from '@/object-record/object-filter-dropdown/hooks/useResetFilterDropdown';
import { fieldMetadataItemUsedInDropdownComponentSelector } from '@/object-record/object-filter-dropdown/states/fieldMetadataItemUsedInDropdownComponentSelector';
import { DropdownMenuHeader } from '@/ui/layout/dropdown/components/DropdownMenuHeader/DropdownMenuHeader';
import { DropdownMenuHeaderLeftComponent } from '@/ui/layout/dropdown/components/DropdownMenuHeader/internal/DropdownMenuHeaderLeftComponent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { LegacyDropdownContent } from '@/ui/layout/dropdown/components/LegacyDropdownContent';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { DropdownComponentInstanceContext } from '@/ui/layout/dropdown/contexts/DropdownComponentInstanceContext';
import { SelectableList } from '@/ui/layout/selectable-list/components/SelectableList';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { ViewBarFilterDropdownActorSubFieldSelectMenuItem } from '@/views/components/ViewBarFilterDropdownActorSubFieldSelectMenuItem';
import { getActorSubFieldSelectableItemId } from '@/views/utils/getActorSubFieldSelectableItemId';
import { IconChevronLeft } from 'twenty-ui/icon';

export const ViewBarFilterDropdownActorSubFieldSelectMenu = () => {
  const fieldMetadataItemUsedInDropdown = useAtomComponentSelectorValue(
    fieldMetadataItemUsedInDropdownComponentSelector,
  );

  const { resetFilterDropdown } = useResetFilterDropdown();

  const dropdownId = useAvailableComponentInstanceIdOrThrow(
    DropdownComponentInstanceContext,
  );

  return (
    <LegacyDropdownContent
      widthInPixels={GenericDropdownContentWidth.ExtraLarge}
    >
      <DropdownMenuHeader
        StartComponent={
          <DropdownMenuHeaderLeftComponent
            onClick={resetFilterDropdown}
            Icon={IconChevronLeft}
          />
        }
      >
        {fieldMetadataItemUsedInDropdown?.label}
      </DropdownMenuHeader>
      <SelectableList
        selectableItemIdArray={ACTOR_FILTER_SUB_FIELDS.map((subField) =>
          getActorSubFieldSelectableItemId(subField.subFieldName),
        )}
        selectableListInstanceId={`${dropdownId}-actor-sub-field-list`}
        focusId={dropdownId}
      >
        <DropdownMenuItemsContainer>
          {ACTOR_FILTER_SUB_FIELDS.map((subField) => (
            <ViewBarFilterDropdownActorSubFieldSelectMenuItem
              key={subField.subFieldName}
              subFieldName={subField.subFieldName}
              label={subField.label}
              iconName={subField.iconName}
            />
          ))}
        </DropdownMenuItemsContainer>
      </SelectableList>
    </LegacyDropdownContent>
  );
};
