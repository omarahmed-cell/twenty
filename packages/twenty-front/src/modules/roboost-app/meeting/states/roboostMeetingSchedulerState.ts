import { type RoboostActivityTarget } from '@/roboost-app/activity/states/roboostActivityComposerState';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type RoboostMeetingSchedulerMode = 'SCHEDULE' | 'LOG';

export type RoboostMeetingScheduler = {
  mode: RoboostMeetingSchedulerMode;
  // The record the pop-up was opened from; it is always associated
  contextTarget: RoboostActivityTarget;
};

export const roboostMeetingSchedulerState =
  createAtomState<RoboostMeetingScheduler | null>({
    key: 'roboostMeetingScheduler',
    defaultValue: null,
  });
