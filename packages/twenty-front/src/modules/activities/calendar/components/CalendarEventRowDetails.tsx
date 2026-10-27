import { styled } from '@linaria/react';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconClock, IconMap, IconUserCircle } from 'twenty-ui/icon';
import { type SelectOption } from 'twenty-ui/primitives/input';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';
import { Tag } from 'twenty-ui/primitives/data-display';
import { type TimelineCalendarEvent } from '~/generated/graphql';

import { getCalendarEventDurationLabel } from '@/activities/calendar/utils/getCalendarEventDurationLabel';
import { getCalendarEventEndDate } from '@/activities/calendar/utils/getCalendarEventEndDate';
import { getCalendarEventStartDate } from '@/activities/calendar/utils/getCalendarEventStartDate';
import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { Select } from '@/ui/input/components/Select';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const StyledDetails = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledDetail = styled.span`
  align-items: center;
  display: inline-flex;
  gap: ${themeCssVariables.spacing[1]};
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledOutcome = styled.div`
  margin-left: auto;
`;

type CalendarEventRowDetailsProps = {
  calendarEvent: Pick<
    TimelineCalendarEvent,
    | 'id'
    | 'isFullDay'
    | 'startsAt'
    | 'meetingType'
    | 'locationType'
    | 'location'
    | 'assignedToId'
    | 'meetingOutcome'
  > & { endsAt?: string };
};

export const CalendarEventRowDetails = ({
  calendarEvent,
}: CalendarEventRowDetailsProps) => {
  const theme = useTheme();
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.CalendarEvent,
  });
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );
  const { updateOneRecord } = useUpdateOneRecord();
  // The timeline query returns a snapshot, so the picked outcome is shown without a refetch
  const [meetingOutcome, setMeetingOutcome] = useState(
    calendarEvent.meetingOutcome,
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

  const findOption = (fieldName: string, value: string | null | undefined) =>
    getFieldOptions(fieldName).find((option) => option.value === value);

  const meetingTypeOption = findOption(
    'meetingType',
    calendarEvent.meetingType,
  );
  const locationTypeOption = findOption(
    'locationType',
    calendarEvent.locationType,
  );
  const meetingOutcomeOptions = getFieldOptions('meetingOutcome');

  const assignedWorkspaceMember = currentWorkspaceMembers.find(
    (workspaceMember) => workspaceMember.id === calendarEvent.assignedToId,
  );

  const durationLabel = calendarEvent.isFullDay
    ? undefined
    : getCalendarEventDurationLabel({
        startsAt: getCalendarEventStartDate(calendarEvent),
        endsAt: getCalendarEventEndDate(calendarEvent),
      });

  const handleMeetingOutcomeChange = async (value: string) => {
    setMeetingOutcome(value);

    await updateOneRecord({
      objectNameSingular: CoreObjectNameSingular.CalendarEvent,
      idToUpdate: calendarEvent.id,
      updateOneRecordInput: { meetingOutcome: value },
    });
  };

  return (
    <StyledDetails>
      {isDefined(durationLabel) && (
        <StyledDetail>
          <IconClock size={theme.icon.size.sm} />
          {durationLabel}
        </StyledDetail>
      )}
      {isDefined(meetingTypeOption) && (
        <Tag color={meetingTypeOption.color ?? 'gray'}>
          {meetingTypeOption.label}
        </Tag>
      )}
      {isDefined(locationTypeOption) && (
        <Tag color={locationTypeOption.color ?? 'gray'}>
          {locationTypeOption.label}
        </Tag>
      )}
      {isNonEmptyString(calendarEvent.location) && (
        <StyledDetail>
          <IconMap size={theme.icon.size.sm} />
          {calendarEvent.location}
        </StyledDetail>
      )}
      {isDefined(assignedWorkspaceMember) && (
        <StyledDetail>
          <IconUserCircle size={theme.icon.size.sm} />
          {`${assignedWorkspaceMember.name.firstName} ${assignedWorkspaceMember.name.lastName}`.trim()}
        </StyledDetail>
      )}
      {meetingOutcomeOptions.length > 0 && (
        // The row opens the meeting on click; picking an outcome must not
        <StyledOutcome onClick={(event) => event.stopPropagation()}>
          <Select
            dropdownId={`calendar-event-outcome-${calendarEvent.id}`}
            options={meetingOutcomeOptions}
            value={meetingOutcome ?? undefined}
            onChange={handleMeetingOutcomeChange}
            renderAsTag
            selectSizeVariant="small"
            dropdownWidthAuto
          />
        </StyledOutcome>
      )}
    </StyledDetails>
  );
};
