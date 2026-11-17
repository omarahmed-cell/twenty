import { gql } from '@apollo/client';

export const PRE_CREATE_WORKSPACE_MEMBER = gql`
  mutation PreCreateWorkspaceMember($input: PreCreateWorkspaceMemberInput!) {
    preCreateWorkspaceMember(input: $input) {
      id
      name {
        firstName
        lastName
      }
      userEmail
      memberStatus
      isPreCreated
    }
  }
`;
