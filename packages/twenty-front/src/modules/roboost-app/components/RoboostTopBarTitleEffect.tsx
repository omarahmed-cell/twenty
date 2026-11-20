import { roboostTopBarTitleState } from '@/roboost-app/states/roboostTopBarTitleState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useEffect } from 'react';

export const RoboostTopBarTitleEffect = ({ title }: { title: string }) => {
  const setRoboostTopBarTitle = useSetAtomState(roboostTopBarTitleState);

  useEffect(() => {
    setRoboostTopBarTitle(title);

    return () => setRoboostTopBarTitle(null);
  }, [title, setRoboostTopBarTitle]);

  return null;
};
