export type LinkedEmail = {
  __typename: string;
  id: string;
  subject: string | null;
  bodyPreview: string | null;
  direction: string | null;
  from: string | null;
  to: string | null;
  sentAt: string | null;
  status: string | null;
  openCount: number | null;
  clickCount: number | null;
  replyCount: number | null;
};
