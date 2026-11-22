import {
  type RoboostRecentRecord,
  roboostRecentRecordsState,
} from '@/roboost-app/search/states/roboostRecentRecordsState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useEffect } from 'react';

const RECENT_RECORDS_LIMIT = 8;

type RoboostRecentRecordEffectProps = RoboostRecentRecord;

export const RoboostRecentRecordEffect = ({
  objectNameSingular,
  recordId,
  label,
}: RoboostRecentRecordEffectProps) => {
  const setRoboostRecentRecords = useSetAtomState(roboostRecentRecordsState);

  useEffect(() => {
    setRoboostRecentRecords((previous) =>
      [
        { objectNameSingular, recordId, label },
        ...previous.filter((recent) => recent.recordId !== recordId),
      ].slice(0, RECENT_RECORDS_LIMIT),
    );
  }, [objectNameSingular, recordId, label, setRoboostRecentRecords]);

  return null;
};
