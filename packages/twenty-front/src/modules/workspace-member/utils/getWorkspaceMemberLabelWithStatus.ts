import { t } from '@lingui/core/macro';

import { isWorkspaceMemberDeactivated } from '@/workspace-member/utils/isWorkspaceMemberDeactivated';

export const getWorkspaceMemberLabelWithStatus = ({
  label,
  memberStatus,
}: {
  label: string;
  memberStatus?: string | null;
}) =>
  isWorkspaceMemberDeactivated({ memberStatus })
    ? t`${label} (deactivated)`
    : label;
