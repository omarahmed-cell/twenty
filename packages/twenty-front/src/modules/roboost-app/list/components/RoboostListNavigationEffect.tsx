import { roboostListNavigationState } from '@/roboost-app/list/states/roboostListNavigationState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useEffect } from 'react';

type RoboostListNavigationEffectProps = {
  objectNameSingular: string;
  recordIds: string[];
};

// The record page's previous and next arrows walk the page of the list last shown
export const RoboostListNavigationEffect = ({
  objectNameSingular,
  recordIds,
}: RoboostListNavigationEffectProps) => {
  const setRoboostListNavigation = useSetAtomState(roboostListNavigationState);
  const recordIdsKey = recordIds.join(',');

  useEffect(() => {
    setRoboostListNavigation({
      objectNameSingular,
      recordIds: recordIdsKey === '' ? [] : recordIdsKey.split(','),
    });
  }, [objectNameSingular, recordIdsKey, setRoboostListNavigation]);

  return null;
};
