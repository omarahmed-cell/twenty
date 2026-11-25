import { type RoboostUserPermissions } from 'twenty-shared/types';

export type RoboostRecordAccessSubject = {
  workspaceMemberId: string;
  permissions: RoboostUserPermissions;
};

export type RoboostRecordAccessMaps = {
  subjectByRoleId: Record<string, RoboostRecordAccessSubject>;
};
