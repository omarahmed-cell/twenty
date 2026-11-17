export type OwnerResolution =
  | {
      isResolved: true;
      workspaceMemberId: string;
      matchedBy: 'WORKSPACE_MEMBER_ID' | 'EMAIL';
    }
  | {
      isResolved: false;
      reason:
        | 'UNKNOWN_OWNER'
        | 'NO_EMAIL'
        | 'EMAIL_NOT_FOUND'
        | 'AMBIGUOUS_EMAIL';
    };
