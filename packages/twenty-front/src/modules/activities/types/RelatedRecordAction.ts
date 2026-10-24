import { type ReactNode } from 'react';
import { type IconComponent } from 'twenty-ui/icon';

export type RelatedRecordAction = {
  id:
    | 'create-task'
    | 'create-note'
    | 'create-call'
    | 'create-communication'
    | 'attach-file'
    | 'compose-email'
    | 'create-calendar-event';
  label: string;
  Icon: IconComponent;
  isVisible: boolean;
  disabled: boolean;
  disabledReason?: string;
  execute: () => void;
};

export type RelatedRecordActionBinding = {
  action: RelatedRecordAction;
  supportElement?: ReactNode;
};
