import { type Call } from '@/activities/types/Call';
import { type Communication } from '@/activities/types/Communication';
import { type Note } from '@/activities/types/Note';

export type NoteLikeActivity = Note | Call | Communication;
