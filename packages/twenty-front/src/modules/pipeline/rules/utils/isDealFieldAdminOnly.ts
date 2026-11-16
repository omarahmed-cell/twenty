import { CoreObjectNameSingular } from 'twenty-shared/types';

// Close Date follows the stage automation; only Admins set it by hand
export const DEAL_ADMIN_ONLY_FIELD_NAMES = ['closeDate'];

export const getDealAdminOnlyFieldNamesForViewer = ({
  objectNameSingular,
  isAdmin,
}: {
  objectNameSingular: string | undefined;
  isAdmin: boolean;
}): string[] =>
  objectNameSingular === CoreObjectNameSingular.Opportunity && !isAdmin
    ? DEAL_ADMIN_ONLY_FIELD_NAMES
    : [];
