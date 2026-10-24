import { type ActivityObjectNameSingular } from '@/activities/types/ActivityObjectNameSingular';
import { CoreObjectNameSingular } from 'twenty-shared/types';

const ACTIVITY_OBJECT_NAME_SINGULARS: string[] = [
  CoreObjectNameSingular.Note,
  CoreObjectNameSingular.Task,
  CoreObjectNameSingular.Call,
  CoreObjectNameSingular.Communication,
];

export const isActivityObjectNameSingular = (
  objectNameSingular: string,
): objectNameSingular is ActivityObjectNameSingular =>
  ACTIVITY_OBJECT_NAME_SINGULARS.includes(objectNameSingular);
