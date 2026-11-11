import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { type TimelineActivityAction } from 'twenty-shared/timeline';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const getLinkedLabel = (
  objectNameSingular: string | undefined,
  objectLabel: string,
  detailLabel: string | undefined,
  emailDirection: string | undefined,
): string => {
  switch (objectNameSingular) {
    case CoreObjectNameSingular.Note:
      return t`added a note`;
    case CoreObjectNameSingular.Task:
      return t`added a task`;
    case CoreObjectNameSingular.Call:
      return t`logged a call`;
    case CoreObjectNameSingular.Communication:
      return isNonEmptyString(detailLabel)
        ? t`logged a ${detailLabel} message`
        : t`logged a message`;
    case CoreObjectNameSingular.Email:
      return emailDirection === 'OUTGOING'
        ? t`sent an email`
        : t`logged an email`;
    case CoreObjectNameSingular.Attachment:
      return t`attached a file`;
    case CoreObjectNameSingular.Message:
      return t`sent or received an email`;
    case CoreObjectNameSingular.CalendarEvent:
      return t`attended a meeting`;
    default:
      return t`linked a ${objectLabel}`;
  }
};

const getUnlinkedLabel = (
  objectNameSingular: string | undefined,
  objectLabel: string,
): string => {
  switch (objectNameSingular) {
    case CoreObjectNameSingular.Note:
      return t`removed a note`;
    case CoreObjectNameSingular.Task:
      return t`removed a task`;
    case CoreObjectNameSingular.Call:
      return t`removed a call`;
    case CoreObjectNameSingular.Communication:
      return t`removed a message`;
    case CoreObjectNameSingular.Email:
      return t`removed an email`;
    case CoreObjectNameSingular.Attachment:
      return t`removed an attachment`;
    default:
      return t`unlinked a ${objectLabel}`;
  }
};

const getUpdatedLabel = (
  objectNameSingular: string | undefined,
  objectLabel: string,
): string => {
  switch (objectNameSingular) {
    case CoreObjectNameSingular.Note:
      return t`updated a note`;
    case CoreObjectNameSingular.Task:
      return t`updated a task`;
    case CoreObjectNameSingular.Call:
      return t`updated a call`;
    case CoreObjectNameSingular.Communication:
      return t`updated a message`;
    case CoreObjectNameSingular.Email:
      return t`updated an email`;
    default:
      return t`updated a ${objectLabel}`;
  }
};

// Worded from the action and linked object rather than the stored type label, so
// events recorded under the generic "was linked by" type read the same way
export const getLinkedActivityEventLabel = ({
  action,
  objectNameSingular,
  objectLabel,
  detailLabel,
  eventTypeLabel,
  emailDirection,
}: {
  action: TimelineActivityAction | null;
  objectNameSingular: string | undefined;
  objectLabel: string;
  detailLabel?: string;
  eventTypeLabel?: string;
  emailDirection?: string;
}): string => {
  const appendDetail = (label: string) =>
    isNonEmptyString(detailLabel) ? `${label} — ${detailLabel}` : label;

  switch (action) {
    case 'linked':
      if (objectNameSingular === CoreObjectNameSingular.Email) {
        const label = getLinkedLabel(
          objectNameSingular,
          objectLabel,
          detailLabel,
          emailDirection,
        );

        return isNonEmptyString(detailLabel)
          ? `${label} · ${detailLabel}`
          : label;
      }

      return objectNameSingular === CoreObjectNameSingular.Communication
        ? getLinkedLabel(
            objectNameSingular,
            objectLabel,
            detailLabel,
            undefined,
          )
        : appendDetail(
            getLinkedLabel(
              objectNameSingular,
              objectLabel,
              detailLabel,
              undefined,
            ),
          );
    case 'unlinked':
      return getUnlinkedLabel(objectNameSingular, objectLabel);
    case 'updated':
      return appendDetail(getUpdatedLabel(objectNameSingular, objectLabel));
    default:
      return isDefined(eventTypeLabel)
        ? appendDetail(eventTypeLabel)
        : t`linked a ${objectLabel}`;
  }
};
