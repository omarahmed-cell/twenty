import { objectFilterDropdownAnyFieldSearchIsSelectedComponentState } from '@/object-record/object-filter-dropdown/states/objectFilterDropdownAnyFieldSearchIsSelectedComponentState';
import { objectFilterDropdownFilterIsSelectedComponentState } from '@/object-record/object-filter-dropdown/states/objectFilterDropdownFilterIsSelectedComponentState';
import { objectFilterDropdownIsSelectingSubFieldComponentState } from '@/object-record/object-filter-dropdown/states/objectFilterDropdownIsSelectingSubFieldComponentState';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { ViewBarFilterDropdownActorSubFieldSelectMenu } from '@/views/components/ViewBarFilterDropdownActorSubFieldSelectMenu';
import { ViewBarFilterDropdownAnyFieldSearchInput } from '@/views/components/ViewBarFilterDropdownAnyFieldSearchInput';
import { ViewBarFilterDropdownFieldSelectMenu } from '@/views/components/ViewBarFilterDropdownFieldSelectMenu';
import { ViewBarFilterDropdownFilterInput } from '@/views/components/ViewBarFilterDropdownFilterInput';

export const ViewBarFilterDropdownContent = () => {
  const [objectFilterDropdownFilterIsSelected] = useAtomComponentState(
    objectFilterDropdownFilterIsSelectedComponentState,
  );

  const objectFilterDropdownAnyFieldSearchIsSelected =
    useAtomComponentStateValue(
      objectFilterDropdownAnyFieldSearchIsSelectedComponentState,
    );

  const objectFilterDropdownIsSelectingSubField = useAtomComponentStateValue(
    objectFilterDropdownIsSelectingSubFieldComponentState,
  );

  const isAnyFieldSearchFilter = objectFilterDropdownAnyFieldSearchIsSelected;

  if (isAnyFieldSearchFilter) {
    return <ViewBarFilterDropdownAnyFieldSearchInput />;
  }

  if (objectFilterDropdownIsSelectingSubField) {
    return <ViewBarFilterDropdownActorSubFieldSelectMenu />;
  }

  const shouldShowFilterInput = objectFilterDropdownFilterIsSelected;

  return (
    <>
      {shouldShowFilterInput ? (
        <ViewBarFilterDropdownFilterInput />
      ) : (
        <ViewBarFilterDropdownFieldSelectMenu />
      )}
    </>
  );
};
