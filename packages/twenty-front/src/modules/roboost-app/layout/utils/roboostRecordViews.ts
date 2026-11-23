import { type RoboostRecordLayoutRecord } from '@/roboost-app/layout/states/roboostRecordLayoutsState';
import { isNonEmptyString, isObject } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

// Named record views are extra layout rows whose layout carries a viewName; the Default view has none
export const getRoboostRecordViewName = (
  record: Pick<RoboostRecordLayoutRecord, 'layout'>,
) =>
  isObject(record.layout) &&
  isNonEmptyString((record.layout as { viewName?: unknown }).viewName)
    ? (record.layout as { viewName: string }).viewName
    : undefined;

export const isRoboostDefaultRecordLayout = (
  record: Pick<RoboostRecordLayoutRecord, 'layout' | 'roleId' | 'teamId'>,
) =>
  !isDefined(record.roleId) &&
  !isDefined(record.teamId) &&
  !isDefined(getRoboostRecordViewName(record));
