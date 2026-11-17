import { splitWorkspaceMemberItemsByStatus } from '@/object-record/object-filter-dropdown/utils/splitWorkspaceMemberItemsByStatus';
import { type SelectableItem } from '@/object-record/select/types/SelectableItem';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { deactivatedWorkspaceMemberIdsSelector } from '@/workspace-member/states/deactivatedWorkspaceMemberIdsSelector';
import { useLingui } from '@lingui/react/macro';

export const useWorkspaceMemberFilterItemSections = ({
  itemsToSelect,
  isWorkspaceMemberList,
}: {
  itemsToSelect: SelectableItem[];
  isWorkspaceMemberList: boolean;
}) => {
  const { t } = useLingui();
  const deactivatedWorkspaceMemberIds = useAtomStateValue(
    deactivatedWorkspaceMemberIdsSelector,
  );

  if (!isWorkspaceMemberList) {
    return {
      activeItemsToSelect: itemsToSelect,
      deactivatedSection: undefined,
    };
  }

  const { activeItems, deactivatedItems } = splitWorkspaceMemberItemsByStatus({
    items: itemsToSelect,
    deactivatedWorkspaceMemberIds,
  });

  return {
    activeItemsToSelect: activeItems,
    deactivatedSection: {
      label: t`Deactivated`,
      items: deactivatedItems,
    },
  };
};
