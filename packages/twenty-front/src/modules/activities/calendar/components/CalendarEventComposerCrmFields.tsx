import { t } from '@lingui/core/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { type SelectOption } from 'twenty-ui/primitives/input';

import { type CalendarEventCrmFields } from '@/activities/calendar/hooks/useCalendarEventComposerCrmFields';
import { ComposerFieldRow } from '@/activities/components/ComposerFieldRow';
import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { Select } from '@/ui/input/components/Select';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const NO_VALUE = '';

type CalendarEventComposerCrmFieldsProps = {
  crmFields: CalendarEventCrmFields;
  onChange: <TFieldName extends keyof CalendarEventCrmFields>(
    fieldName: TFieldName,
    value: CalendarEventCrmFields[TFieldName],
  ) => void;
};

export const CalendarEventComposerCrmFields = ({
  crmFields,
  onChange,
}: CalendarEventComposerCrmFieldsProps) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.CalendarEvent,
  });
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );

  const getFieldOptions = (fieldName: string): SelectOption<string>[] =>
    (
      objectMetadataItem.fields.find((field) => field.name === fieldName)
        ?.options ?? []
    ).map((option) => ({
      label: option.label,
      value: option.value,
      color: option.color,
    }));

  const workspaceMemberOptions: SelectOption<string>[] =
    currentWorkspaceMembers.map((workspaceMember) => ({
      label:
        `${workspaceMember.name.firstName} ${workspaceMember.name.lastName}`.trim(),
      value: workspaceMember.id,
    }));

  const emptyOption: SelectOption<string> = {
    label: t`Not set`,
    value: NO_VALUE,
  };

  return (
    <>
      <ComposerFieldRow label={t`Location type`}>
        <Select
          dropdownId="calendar-event-composer-location-type"
          fullWidth
          variant="transparent"
          renderAsTag
          emptyOption={emptyOption}
          value={crmFields.locationType ?? NO_VALUE}
          options={getFieldOptions('locationType')}
          onChange={(value) => onChange('locationType', value || null)}
        />
      </ComposerFieldRow>
      <ComposerFieldRow label={t`Meeting type`}>
        <Select
          dropdownId="calendar-event-composer-meeting-type"
          fullWidth
          variant="transparent"
          renderAsTag
          emptyOption={emptyOption}
          value={crmFields.meetingType ?? NO_VALUE}
          options={getFieldOptions('meetingType')}
          onChange={(value) => onChange('meetingType', value || null)}
        />
      </ComposerFieldRow>
      <ComposerFieldRow label={t`Outcome`}>
        <Select
          dropdownId="calendar-event-composer-meeting-outcome"
          fullWidth
          variant="transparent"
          renderAsTag
          value={crmFields.meetingOutcome}
          options={getFieldOptions('meetingOutcome')}
          onChange={(value) => onChange('meetingOutcome', value)}
        />
      </ComposerFieldRow>
      <ComposerFieldRow label={t`Assigned to`}>
        <Select
          dropdownId="calendar-event-composer-assigned-to"
          fullWidth
          variant="transparent"
          withSearchInput
          emptyOption={emptyOption}
          value={crmFields.assignedToId ?? NO_VALUE}
          options={workspaceMemberOptions}
          onChange={(value) => onChange('assignedToId', value || null)}
        />
      </ComposerFieldRow>
    </>
  );
};
