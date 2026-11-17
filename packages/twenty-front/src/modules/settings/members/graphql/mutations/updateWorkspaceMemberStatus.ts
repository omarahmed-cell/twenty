import { gql } from '@apollo/client';

export const UPDATE_WORKSPACE_MEMBER_STATUS = gql`
  mutation UpdateWorkspaceMemberStatus(
    $workspaceMemberId: UUID!
    $memberStatus: String!
  ) {
    updateWorkspaceMemberStatus(
      workspaceMemberId: $workspaceMemberId
      memberStatus: $memberStatus
    ) {
      id
      memberStatus
      isPreCreated
    }
  }
`;
