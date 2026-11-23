import { type RoboostActivityTypeKey } from '@/roboost-app/timeline/types/RoboostActivityTypeKey';
import { msg } from '@lingui/core/macro';
import { type MessageDescriptor } from '@lingui/core';

export type RoboostActivityTypeCategory = {
  id: string;
  label: MessageDescriptor;
  types: { key: RoboostActivityTypeKey; label: MessageDescriptor }[];
};

export const ROBOOST_ACTIVITY_TYPE_CATEGORIES: RoboostActivityTypeCategory[] = [
  {
    id: 'communication',
    label: msg`Communication`,
    types: [
      { key: 'calls', label: msg`Calls` },
      { key: 'emails', label: msg`Emails` },
      { key: 'whatsapp', label: msg`WhatsApp` },
      { key: 'linkedin', label: msg`LinkedIn` },
      { key: 'sms', label: msg`SMS` },
    ],
  },
  {
    id: 'team',
    label: msg`Team activity`,
    types: [
      { key: 'meetings', label: msg`Meetings` },
      { key: 'notes', label: msg`Notes` },
      { key: 'tasks', label: msg`Tasks` },
    ],
  },
  {
    id: 'contact',
    label: msg`Contact activity`,
    types: [{ key: 'emailTracking', label: msg`Email tracking` }],
  },
  {
    id: 'updates',
    label: msg`Updates`,
    types: [
      { key: 'fieldChanges', label: msg`Field changes` },
      { key: 'stageChanges', label: msg`Stage changes` },
      { key: 'recordCreated', label: msg`Record created` },
      { key: 'workflowActivity', label: msg`Workflow activity` },
      { key: 'associations', label: msg`Association changes` },
      { key: 'otherUpdates', label: msg`Deleted and restored` },
    ],
  },
];
