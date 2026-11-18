const GMAIL_READ_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://mail.google.com/',
];

export const hasGmailReadScope = (scopes: string[] | null | undefined) =>
  (scopes ?? []).some((scope) => GMAIL_READ_SCOPES.includes(scope));
