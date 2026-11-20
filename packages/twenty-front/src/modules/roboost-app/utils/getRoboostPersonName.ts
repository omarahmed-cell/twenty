import { isNonEmptyString } from '@sniptt/guards';

export type RoboostFullName = {
  firstName?: string | null;
  lastName?: string | null;
} | null;

export const getRoboostPersonName = (name: RoboostFullName | undefined) =>
  [name?.firstName, name?.lastName].filter(isNonEmptyString).join(' ');
