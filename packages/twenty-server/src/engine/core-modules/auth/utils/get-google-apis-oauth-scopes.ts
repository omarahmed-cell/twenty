// email and profile take no googleapis.com/auth/ prefix, see https://developers.google.com/identity/protocols/oauth2/scopes
export const getGoogleApisOauthScopes = () => {
  return [
    'email',
    'profile',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/profile.emails.read',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    // Meet-created files only (recordings, transcripts, Gemini notes), never the rest of Drive
    'https://www.googleapis.com/auth/drive.meet.readonly',
    'https://www.googleapis.com/auth/meetings.space.readonly',
  ];
};
