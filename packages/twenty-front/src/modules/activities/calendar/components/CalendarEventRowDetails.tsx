import { styled } from '@linaria/react';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { IconClock, IconMap } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';
import { type TimelineCalendarEvent } from '~/generated/graphql';

import { getCalendarEventDurationLabel } from '@/activities/calendar/utils/getCalendarEventDurationLabel';
import { getCalendarEventEndDate } from '@/activities/calendar/utils/getCalendarEventEndDate';
import { getCalendarEventStartDate } from '@/activities/calendar/utils/getCalendarEventStartDate';

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

type CalendarEventRowDetailsProps = {
  calendarEvent: Pick<
    TimelineCalendarEvent,
    'id' | 'isFullDay' | 'startsAt' | 'location'
  > & { endsAt?: string };
};

export const CalendarEventRowDetails = ({
  calendarEvent,
}: CalendarEventRowDetailsProps) => {
  const theme = useTheme();

  const durationLabel = calendarEvent.isFullDay
    ? undefined
    : getCalendarEventDurationLabel({
        startsAt: getCalendarEventStartDate(calendarEvent),
        endsAt: getCalendarEventEndDate(calendarEvent),
      });

  return (
    <StyledDetails>
      {isDefined(durationLabel) && (
        <StyledDetail>
          <IconClock size={theme.icon.size.sm} />
          {durationLabel}
        </StyledDetail>
      )}
      {isNonEmptyString(calendarEvent.location) && (
        <StyledDetail>
          <IconMap size={theme.icon.size.sm} />
          {calendarEvent.location}
        </StyledDetail>
      )}
    </StyledDetails>
  );
};
