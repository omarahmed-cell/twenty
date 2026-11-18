import gql from 'graphql-tag';

export const GMAIL_EXTENSION_TOKENS = gql`
  query GmailExtensionTokens {
    gmailExtensionTokens {
      id
      createdAt
      lastUsedAt
    }
  }
`;
