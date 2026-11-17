import { useResetFilterDropdown } from '@/object-record/object-filter-dropdown/hooks/useResetFilterDropdown';
import { fieldMetadataItemUsedInDropdownComponentSelector } from '@/object-record/object-filter-dropdown/states/fieldMetadataItemUsedInDropdownComponentSelector';
import { subFieldNameUsedInDropdownComponentState } from '@/object-record/object-filter-dropdown/states/subFieldNameUsedInDropdownComponentState';
import { getActorFilterSubFieldLabel } from '@/object-record/object-filter-dropdown/utils/getActorFilterSubFieldLabel';
import { DropdownMenuHeader } from '@/ui/layout/dropdown/components/DropdownMenuHeader/DropdownMenuHeader';
import { DropdownMenuHeaderLeftComponent } from '@/ui/layout/dropdown/components/DropdownMenuHeader/internal/DropdownMenuHeaderLeftComponent';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { isNonEmptyString } from '@sniptt/guards';
import { FieldMetadataType } from 'twenty-shared/types';
import { IconChevronLeft } from 'twenty-ui/icon';

export const ViewBarFilterDropdownFilterInputMenuHeader = () => {
  const fieldMetadataItemUsedInDropdown = useAtomComponentSelectorValue(
    fieldMetadataItemUsedInDropdownComponentSelector,
  );

  const subFieldNameUsedInDropdown = useAtomComponentStateValue(
    subFieldNameUsedInDropdownComponentState,
  );

  const { resetFilterDropdown } = useResetFilterDropdown();

  const actorFilterSubFieldLabel =
    fieldMetadataItemUsedInDropdown?.type === FieldMetadataType.ACTOR
      ? getActorFilterSubFieldLabel(subFieldNameUsedInDropdown)
      : '';

  const headerLabel = isNonEmptyString(actorFilterSubFieldLabel)
    ? `${fieldMetadataItemUsedInDropdown?.label} / ${actorFilterSubFieldLabel}`
    : fieldMetadataItemUsedInDropdown?.label;

  const handleBackButtonClick = () => {
    resetFilterDropdown();
  };

  return (
    <DropdownMenuHeader
      StartComponent={
        <DropdownMenuHeaderLeftComponent
          onClick={handleBackButtonClick}
          Icon={IconChevronLeft}
        />
      }
    >
      {headerLabel}
    </DropdownMenuHeader>
  );
};
