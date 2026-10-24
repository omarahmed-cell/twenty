import { t } from '@lingui/core/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const getLinkedActivityEventLabel = ({
  objectNameSingular,
  detailLabel,
  eventTypeLabel,
  isLinkedEvent,
}: {
  objectNameSingular: string;
  detailLabel: string;
  eventTypeLabel: string | undefined;
  isLinkedEvent: boolean;
}): string => {
  if (
    isLinkedEvent &&
    objectNameSingular === CoreObjectNameSingular.Communication
  ) {
    return t`logged a ${detailLabel} message`;
  }

  return isDefined(eventTypeLabel)
    ? `${eventTypeLabel} — ${detailLabel}`
    : detailLabel;
};
