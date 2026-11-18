import gql from 'graphql-tag';

export const REVOKE_GMAIL_EXTENSION_TOKEN = gql`
  mutation RevokeGmailExtensionToken($id: String!) {
    revokeGmailExtensionToken(id: $id)
  }
`;
