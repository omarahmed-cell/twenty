import { z } from 'zod';

const addressSchema = z.object({
  address: z.string().trim().max(320),
  displayName: z.string().trim().max(320).nullish(),
});

export const gmailExtensionLogInputSchema = z.object({
  emailId: z.string().uuid().optional(),
  direction: z.enum(['OUTGOING', 'INCOMING']),
  subject: z.string().max(2000).nullable().default(null),
  bodyHtml: z.string().max(2_000_000).nullable().default(null),
  from: addressSchema.nullable().default(null),
  to: z.array(addressSchema).max(200).default([]),
  cc: z.array(addressSchema).max(200).default([]),
  bcc: z.array(addressSchema).max(200).default([]),
  sentAt: z.string().datetime({ offset: true }).optional(),
  gmailMessageId: z.string().max(200).nullish(),
  gmailThreadId: z.string().max(200).nullish(),
  rfcMessageId: z.string().max(998).nullish(),
  inReplyTo: z.string().max(998).nullish(),
  trackEnabled: z.boolean().default(false),
  createUnknownContacts: z.boolean().default(true),
  links: z
    .object({
      personIds: z.array(z.string().uuid()).max(200).default([]),
      companyIds: z.array(z.string().uuid()).max(200).default([]),
      opportunityIds: z.array(z.string().uuid()).max(200).default([]),
    })
    .default({ personIds: [], companyIds: [], opportunityIds: [] }),
});

export type GmailExtensionLogInput = z.infer<
  typeof gmailExtensionLogInputSchema
>;
