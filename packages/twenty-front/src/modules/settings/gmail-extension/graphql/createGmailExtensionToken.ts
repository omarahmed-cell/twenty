import gql from 'graphql-tag';

export const CREATE_GMAIL_EXTENSION_TOKEN = gql`
  mutation CreateGmailExtensionToken {
    createGmailExtensionToken {
      id
      token
    }
  }
`;
