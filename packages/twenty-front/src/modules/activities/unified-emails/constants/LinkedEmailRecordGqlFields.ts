import { type RecordGqlFields } from 'twenty-shared/types';

export const LINKED_EMAIL_RECORD_GQL_FIELDS: RecordGqlFields = {
  id: true,
  subject: true,
  bodyPreview: true,
  direction: true,
  from: true,
  to: true,
  cc: true,
  sentAt: true,
  status: true,
  openCount: true,
  clickCount: true,
  replyCount: true,
  loggedBy: { id: true, name: true },
};
