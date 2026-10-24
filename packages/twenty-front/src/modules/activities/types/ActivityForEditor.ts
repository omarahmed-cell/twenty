import { type NoteLikeActivity } from '@/activities/types/NoteLikeActivity';
import { type Task } from '@/activities/types/Task';

export type ActivityForEditor = Partial<Task | NoteLikeActivity>;
