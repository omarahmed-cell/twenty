import { msg } from '@lingui/core/macro';
import { type MessageDescriptor } from '@lingui/core';
import { type StageCalculatedPropertyKind } from 'twenty-shared/utils';

export const STAGE_CALCULATED_PROPERTY_KIND_LABELS: Record<
  StageCalculatedPropertyKind,
  MessageDescriptor
> = {
  dateEntered: msg`Date entered`,
  dateExited: msg`Date exited`,
  cumulativeTimeIn: msg`Cumulative time in`,
  latestTimeIn: msg`Latest time in`,
};
