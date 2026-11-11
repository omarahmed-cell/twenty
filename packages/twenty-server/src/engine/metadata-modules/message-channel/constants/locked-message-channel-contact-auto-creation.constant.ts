import { MessageChannelContactAutoCreationPolicy } from 'twenty-shared/types';

// Contacts and companies must never be created from synced mail in this fork.
export const LOCKED_MESSAGE_CHANNEL_CONTACT_AUTO_CREATION = {
  isContactAutoCreationEnabled: false,
  contactAutoCreationPolicy: MessageChannelContactAutoCreationPolicy.NONE,
} as const;
