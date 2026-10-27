import { isNonEmptyString } from '@sniptt/guards';

export const getFullName = (
  name: { firstName?: string | null; lastName?: string | null } | undefined,
) =>
  [name?.firstName, name?.lastName]
    .filter((namePart) => isNonEmptyString(namePart))
    .join(' ');
