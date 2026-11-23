import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
import { type RoboostListSort } from '@/roboost-app/list/components/RoboostListTable';
import {
  EMPTY_ROBOOST_LIST_FILTERS,
  type RoboostListFilters,
} from '@/roboost-app/list/types/RoboostListFilters';
import { type View } from '@/views/types/View';
import { ViewVisibility } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export type RoboostSavedViewState = {
  filters: RoboostListFilters;
  sort: RoboostListSort | null;
};

const EMPTY_STATE: RoboostSavedViewState = {
  filters: EMPTY_ROBOOST_LIST_FILTERS,
  sort: null,
};

// "Only me" views keep their filters and sort as the member's own var; shared views as a workspace var (admins write it)
export const useRoboostSavedViewState = (view: View | undefined) => {
  const { getUserVar, getWorkspaceDefault, setUserVar, setWorkspaceDefault } =
    useRoboostUserVars();
  const key = `roboost.viewState.${view?.id ?? 'none'}`;
  const isPersonal = view?.visibility === ViewVisibility.UNLISTED;

  const stored = isPersonal
    ? getUserVar<RoboostSavedViewState>(key)
    : getWorkspaceDefault<RoboostSavedViewState>(key);
  const savedState: RoboostSavedViewState = isDefined(stored)
    ? {
        filters: { ...EMPTY_ROBOOST_LIST_FILTERS, ...stored.filters },
        sort: stored.sort ?? null,
      }
    : EMPTY_STATE;

  const saveViewState = async (state: RoboostSavedViewState) => {
    if (isPersonal) {
      await setUserVar(key, state);
    } else {
      await setWorkspaceDefault(key, state);
    }
  };

  const saveViewStateFor = async (
    targetView: Pick<View, 'id' | 'visibility'>,
    state: RoboostSavedViewState,
  ) => {
    const targetKey = `roboost.viewState.${targetView.id}`;

    if (targetView.visibility === ViewVisibility.UNLISTED) {
      await setUserVar(targetKey, state);
    } else {
      await setWorkspaceDefault(targetKey, state);
    }
  };

  return { savedState, saveViewState, saveViewStateFor, isPersonal };
};
