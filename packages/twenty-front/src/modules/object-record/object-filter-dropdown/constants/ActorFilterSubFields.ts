import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export type ActorFilterSubFieldName = 'name' | 'workspaceMemberId' | 'source';

// Filter-specific wording and order; the data model labels stay as they are for import and export.
export const ACTOR_FILTER_SUB_FIELDS: Array<{
  subFieldName: ActorFilterSubFieldName;
  label: MessageDescriptor;
  iconName: string;
}> = [
  { subFieldName: 'name', label: msg`Name`, iconName: 'IconTextSize' },
  {
    subFieldName: 'workspaceMemberId',
    label: msg`User`,
    iconName: 'IconUserCircle',
  },
  { subFieldName: 'source', label: msg`Source`, iconName: 'IconTransferIn' },
];
