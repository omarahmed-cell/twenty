export type RoboostUser = {
  workspaceMemberId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  memberStatus: string;
  isPreCreated: boolean;
  hasAccount: boolean;
  createdAt: string;
  role: 'ADMIN' | 'MEMBER';
  access: string | null;
  mainTeamId: string | null;
  mainTeamName: string | null;
  additionalTeamNames: string[];
};

export type RoboostPendingInvite = {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  expiresAt: string;
  invitedAt: string | null;
};

export type RoboostUsersPage = {
  viewerIsAdmin: boolean;
  users: RoboostUser[];
  pendingInvites: RoboostPendingInvite[];
};

export type RoboostTeamMember = {
  workspaceMemberId: string;
  name: string;
  isMain: boolean;
};

export type RoboostTeam = {
  id: string;
  name: string;
  createdAt: string;
  members: RoboostTeamMember[];
};

export type RoboostPermissionHistoryEntry = {
  id: string;
  createdAt: string;
  actorName: string | null;
  targetWorkspaceMemberId: string | null;
  targetLabel: string;
  kind: string;
  setting: string;
  fromValue: string | null;
  toValue: string | null;
};
