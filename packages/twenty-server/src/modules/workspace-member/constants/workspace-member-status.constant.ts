export const WORKSPACE_MEMBER_STATUS = {
  ACTIVE: 'ACTIVE',
  DEACTIVATED: 'DEACTIVATED',
} as const;

export type WorkspaceMemberStatus =
  (typeof WORKSPACE_MEMBER_STATUS)[keyof typeof WORKSPACE_MEMBER_STATUS];
