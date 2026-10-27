const GOOGLE_DOC_MIME_TYPE = 'application/vnd.google-apps.document';

export type GoogleCalendarAttachment = {
  fileId?: string | null;
  fileUrl?: string | null;
  title?: string | null;
  mimeType?: string | null;
};

export type GoogleMeetAttachments = {
  recording: GoogleCalendarAttachment | undefined;
  geminiNotes: GoogleCalendarAttachment | undefined;
  transcript: GoogleCalendarAttachment | undefined;
};

const isGoogleDoc = (attachment: GoogleCalendarAttachment) =>
  attachment.mimeType === GOOGLE_DOC_MIME_TYPE;

// Meet names its files "<meeting> - <date> - Recording", "... - Transcript" and "Notes by Gemini"
export const selectGoogleMeetAttachments = (
  attachments: GoogleCalendarAttachment[],
): GoogleMeetAttachments => ({
  recording: attachments.find(
    (attachment) => attachment.mimeType?.startsWith('video/') ?? false,
  ),
  geminiNotes: attachments.find(
    (attachment) =>
      isGoogleDoc(attachment) &&
      /gemini/i.test(attachment.title ?? '') &&
      !/transcript/i.test(attachment.title ?? ''),
  ),
  transcript: attachments.find(
    (attachment) =>
      isGoogleDoc(attachment) && /transcript/i.test(attachment.title ?? ''),
  ),
});
