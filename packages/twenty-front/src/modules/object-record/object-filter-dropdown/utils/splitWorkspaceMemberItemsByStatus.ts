import { type SelectableItem } from '@/object-record/select/types/SelectableItem';

export const splitWorkspaceMemberItemsByStatus = ({
  items,
  deactivatedWorkspaceMemberIds,
}: {
  items: SelectableItem[];
  deactivatedWorkspaceMemberIds: string[];
}) => {
  const deactivatedWorkspaceMemberIdSet = new Set(
    deactivatedWorkspaceMemberIds,
  );

  return {
    activeItems: items.filter(
      (item) => !deactivatedWorkspaceMemberIdSet.has(item.id),
    ),
    deactivatedItems: items.filter((item) =>
      deactivatedWorkspaceMemberIdSet.has(item.id),
    ),
  };
};
