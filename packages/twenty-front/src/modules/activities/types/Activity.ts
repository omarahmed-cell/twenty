import { type FieldActorValue } from '@/object-record/record-field/ui/types/FieldMetadata';

export type Activity = {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: FieldActorValue | null;
  title: string;
  bodyV2?: {
    blocknote: string | null;
    markdown: string | null;
  };
};
