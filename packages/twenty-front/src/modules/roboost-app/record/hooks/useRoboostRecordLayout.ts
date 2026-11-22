import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
import { isDefined } from 'twenty-shared/utils';

export type RoboostRecordPanelSide = 'left' | 'right';

export type RoboostRecordLayoutOrder = Record<RoboostRecordPanelSide, string[]>;

const EMPTY_ORDER: RoboostRecordLayoutOrder = { left: [], right: [] };

const sortByOrder = (ids: string[], order: string[]) => {
  const rank = new Map(order.map((id, index) => [id, index]));

  return [...ids].sort(
    (first, second) =>
      (rank.get(first) ?? order.length + ids.indexOf(first)) -
      (rank.get(second) ?? order.length + ids.indexOf(second)),
  );
};

// Container order per object: the member's own order, else the admin default, else the natural order
export const useRoboostRecordLayout = (objectNameSingular: string) => {
  const { getUserVar, getWorkspaceDefault, setUserVar, setWorkspaceDefault } =
    useRoboostUserVars();
  const key = `roboost.recordLayout.${objectNameSingular}`;

  const userOrder = getUserVar<RoboostRecordLayoutOrder>(key);
  const defaultOrder = getWorkspaceDefault<RoboostRecordLayoutOrder>(key);
  const order = userOrder ?? defaultOrder ?? EMPTY_ORDER;

  const orderIds = (side: RoboostRecordPanelSide, ids: string[]) =>
    sortByOrder(ids, order[side] ?? []);

  const move = (
    side: RoboostRecordPanelSide,
    currentIds: string[],
    draggedId: string,
    targetId: string,
  ) => {
    if (draggedId === targetId) {
      return;
    }
    const nextIds = currentIds.filter((id) => id !== draggedId);
    const targetIndex = nextIds.indexOf(targetId);
    const draggedFromIndex = currentIds.indexOf(draggedId);
    const insertIndex =
      draggedFromIndex < currentIds.indexOf(targetId)
        ? targetIndex + 1
        : targetIndex;

    nextIds.splice(insertIndex, 0, draggedId);
    setUserVar(key, { ...EMPTY_ORDER, ...order, [side]: nextIds });
  };

  const resetToDefault = () => setUserVar(key, null);

  const saveAsDefault = () => setWorkspaceDefault(key, order);

  return {
    orderIds,
    move,
    resetToDefault,
    saveAsDefault,
    hasPersonalOrder: isDefined(userOrder),
  };
};
