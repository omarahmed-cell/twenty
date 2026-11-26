import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { FieldActorSource } from 'twenty-shared/types';
import {
  type IconComponent,
  IconApi,
  IconApps,
  IconCsv,
  IconFileText,
  IconGmail,
  IconGoogleCalendar,
  IconLego,
  IconListCheck,
  IconRobot,
  IconSend,
  IconSettingsAutomation,
  IconUserCircle,
  IconWebhook,
} from 'twenty-ui/icon';

export type ActorSourceFilterOptionConfig = {
  label: MessageDescriptor;
  AvatarIcon: IconComponent;
  isIconInverted?: boolean;
};

// Keyed by the shared enum so a new source fails typecheck until it gets a label; key order is display order.
export const ACTOR_SOURCE_FILTER_OPTION_CONFIGS: Record<
  FieldActorSource,
  ActorSourceFilterOptionConfig
> = {
  [FieldActorSource.MANUAL]: {
    label: msg`Manual`,
    AvatarIcon: IconUserCircle,
    isIconInverted: true,
  },
  [FieldActorSource.IMPORT]: {
    label: msg`Import`,
    AvatarIcon: IconCsv,
    isIconInverted: true,
  },
  [FieldActorSource.API]: {
    label: msg`API`,
    AvatarIcon: IconApi,
    isIconInverted: true,
  },
  [FieldActorSource.EMAIL]: {
    label: msg`Email`,
    AvatarIcon: IconGmail,
  },
  [FieldActorSource.CALENDAR]: {
    label: msg`Calendar`,
    AvatarIcon: IconGoogleCalendar,
  },
  [FieldActorSource.WORKFLOW]: {
    label: msg`Workflow`,
    AvatarIcon: IconSettingsAutomation,
    isIconInverted: true,
  },
  [FieldActorSource.SYSTEM]: {
    label: msg`System`,
    AvatarIcon: IconRobot,
    isIconInverted: true,
  },
  [FieldActorSource.AGENT]: {
    label: msg`Agent`,
    AvatarIcon: IconLego,
    isIconInverted: true,
  },
  [FieldActorSource.WEBHOOK]: {
    label: msg`Webhook`,
    AvatarIcon: IconWebhook,
    isIconInverted: true,
  },
  [FieldActorSource.APPLICATION]: {
    label: msg`Application`,
    AvatarIcon: IconApps,
    isIconInverted: true,
  },
  [FieldActorSource.FORMS]: {
    label: msg`Forms`,
    AvatarIcon: IconListCheck,
    isIconInverted: true,
  },
  [FieldActorSource.DOCUMENT_APP]: {
    label: msg`Document app`,
    AvatarIcon: IconFileText,
    isIconInverted: true,
  },
  [FieldActorSource.SEQUENCE]: {
    label: msg`Sequence`,
    AvatarIcon: IconSend,
    isIconInverted: true,
  },
  [FieldActorSource.GMAIL_EXTENSION]: {
    label: msg`Gmail extension`,
    AvatarIcon: IconGmail,
    isIconInverted: true,
  },
};
