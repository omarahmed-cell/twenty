import { type CoreObjectNameSingular } from 'twenty-shared/types';

export type NoteLikeActivityObjectNameSingular =
  | CoreObjectNameSingular.Note
  | CoreObjectNameSingular.Call
  | CoreObjectNameSingular.Communication;
