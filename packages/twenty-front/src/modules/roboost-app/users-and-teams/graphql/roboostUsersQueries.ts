import { gql } from '@apollo/client';

export const ROBOOST_MY_ACCESS = gql`
  query RoboostMyAccess {
    roboostMyAccess {
      workspaceMemberId
      isAdmin
      permissions
      teamIds
    }
  }
`;

export const ROBOOST_USERS = gql`
  query RoboostUsers {
    roboostUsers {
      viewerIsAdmin
      users {
        workspaceMemberId
        name
        email
        avatarUrl
        memberStatus
        isPreCreated
        hasAccount
        createdAt
        role
        access
        mainTeamId
        mainTeamName
        additionalTeamNames
      }
      pendingInvites {
        id
        email
        role
        expiresAt
        invitedAt
      }
    }
  }
`;

export const ROBOOST_TEAMS = gql`
  query RoboostTeams {
    roboostTeams {
      id
      name
      createdAt
      members {
        workspaceMemberId
        name
        isMain
      }
    }
  }
`;

export const ROBOOST_USER_PERMISSIONS = gql`
  query RoboostUserPermissions($workspaceMemberId: String!) {
    roboostUserPermissions(workspaceMemberId: $workspaceMemberId) {
      workspaceMemberId
      name
      isAdmin
      permissions
    }
  }
`;

export const ROBOOST_PERMISSION_HISTORY = gql`
  query RoboostPermissionHistory(
    $workspaceMemberId: String
    $from: String
    $to: String
  ) {
    roboostPermissionHistory(
      workspaceMemberId: $workspaceMemberId
      from: $from
      to: $to
    ) {
      id
      createdAt
      actorName
      targetWorkspaceMemberId
      targetLabel
      kind
      setting
      fromValue
      toValue
    }
  }
`;

export const ROBOOST_SET_USER_ADMIN = gql`
  mutation RoboostSetUserAdmin(
    $workspaceMemberId: String!
    $isAdmin: Boolean!
  ) {
    roboostSetUserAdmin(
      workspaceMemberId: $workspaceMemberId
      isAdmin: $isAdmin
    )
  }
`;

export const ROBOOST_SAVE_USER_PERMISSIONS = gql`
  mutation RoboostSaveUserPermissions(
    $workspaceMemberId: String!
    $permissions: JSON!
  ) {
    roboostSaveUserPermissions(
      workspaceMemberId: $workspaceMemberId
      permissions: $permissions
    )
  }
`;

export const ROBOOST_COPY_PERMISSIONS = gql`
  mutation RoboostCopyPermissions(
    $fromWorkspaceMemberId: String!
    $toWorkspaceMemberIds: [String!]!
  ) {
    roboostCopyPermissions(
      fromWorkspaceMemberId: $fromWorkspaceMemberId
      toWorkspaceMemberIds: $toWorkspaceMemberIds
    )
  }
`;

export const ROBOOST_INVITE_USERS = gql`
  mutation RoboostInviteUsers(
    $emails: [String!]!
    $role: String!
    $copyFromWorkspaceMemberId: String
  ) {
    roboostInviteUsers(
      emails: $emails
      role: $role
      copyFromWorkspaceMemberId: $copyFromWorkspaceMemberId
    )
  }
`;

export const ROBOOST_SET_USER_STATUS = gql`
  mutation RoboostSetUserStatus(
    $workspaceMemberId: String!
    $memberStatus: String!
  ) {
    roboostSetUserStatus(
      workspaceMemberId: $workspaceMemberId
      memberStatus: $memberStatus
    )
  }
`;

export const ROBOOST_SAVE_TEAM = gql`
  mutation RoboostSaveTeam(
    $teamId: String
    $name: String!
    $members: [RoboostTeamMemberInput!]!
  ) {
    roboostSaveTeam(teamId: $teamId, name: $name, members: $members)
  }
`;

export const ROBOOST_DELETE_TEAM = gql`
  mutation RoboostDeleteTeam($teamId: String!) {
    roboostDeleteTeam(teamId: $teamId)
  }
`;

export const ROBOOST_SET_USER_TEAMS = gql`
  mutation RoboostSetUserTeams(
    $workspaceMemberId: String!
    $mainTeamId: String
    $additionalTeamIds: [String!]!
  ) {
    roboostSetUserTeams(
      workspaceMemberId: $workspaceMemberId
      mainTeamId: $mainTeamId
      additionalTeamIds: $additionalTeamIds
    )
  }
`;
