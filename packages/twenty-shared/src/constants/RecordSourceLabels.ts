import { FieldActorSource } from '@/types/composite-types/actor.composite-type';

export const RECORD_SOURCE_LABELS: Record<FieldActorSource, string> = {
  [FieldActorSource.MANUAL]: 'Manual',
  [FieldActorSource.IMPORT]: 'Import',
  [FieldActorSource.API]: 'API',
  [FieldActorSource.EMAIL]: 'Email',
  [FieldActorSource.CALENDAR]: 'Calendar',
  [FieldActorSource.WORKFLOW]: 'Workflow',
  [FieldActorSource.SYSTEM]: 'System',
  [FieldActorSource.AGENT]: 'Agent',
  [FieldActorSource.WEBHOOK]: 'Webhook',
  [FieldActorSource.APPLICATION]: 'Application',
  [FieldActorSource.FORMS]: 'Forms',
  [FieldActorSource.DOCUMENT_APP]: 'Document app',
  [FieldActorSource.SEQUENCE]: 'Sequence',
  [FieldActorSource.GMAIL_EXTENSION]: 'Gmail extension',
};
