import { type CoreObjectNameSingular } from 'twenty-shared/types';

export type ActivityObjectNameSingular =
  | CoreObjectNameSingular.Note
  | CoreObjectNameSingular.Task
  | CoreObjectNameSingular.Call
  | CoreObjectNameSingular.Communication;
