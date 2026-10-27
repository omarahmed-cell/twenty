import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useContext } from 'react';
import { isDefined, isNonEmptyArray } from 'twenty-shared/utils';
import { IconVideo } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

import { CalendarEventParticipantsAvatarGroup } from '@/activities/calendar/components/CalendarEventParticipantsAvatarGroup';
import { CalendarEventRowDetails } from '@/activities/calendar/components/CalendarEventRowDetails';
import { ParticipantChip } from '@/activities/components/ParticipantChip';
import { type TimelineCalendarEventRecord } from '@/activities/timeline-activities/rows/calendar/types/TimelineCalendarEventRecord';
import { getCalendarEventParticipantName } from '@/activities/timeline-activities/rows/calendar/utils/getCalendarEventParticipantName';
import { useOpenCalendarEventInSidePanel } from '@/side-panel/hooks/useOpenCalendarEventInSidePanel';
import { UserContext } from '@/users/contexts/UserContext';
import {
  formatToHumanReadableDay,
  formatToHumanReadableMonth,
  formatToHumanReadableTime,
} from '~/utils/format/formatDate';

const StyledEventCardCalendarEventContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledCalendarEventContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: center;
  min-width: 0;
  width: 100%;
`;

const StyledCalendarEventTop = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  width: 100%;
`;

const StyledCalendarEventTitle = styled.div<{ isCanceled: boolean }>`
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-decoration: ${({ isCanceled }) =>
    isCanceled ? 'line-through' : 'none'};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledCalendarEventSubtitle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledConferenceLink = styled.a`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: inline-flex;
  gap: ${themeCssVariables.spacing[1]};
  text-decoration: underline;
  width: fit-content;
`;

const StyledSectionLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledAttendees = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledDescription = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  overflow-wrap: anywhere;
  white-space: pre-line;
`;

const StyledCalendarEventDateCard = styled.div`
  align-items: center;
  align-self: flex-start;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.spacing[1]};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  justify-content: center;
  padding: ${themeCssVariables.spacing[1]};
`;

const StyledCalendarEventDateCardMonth = styled.div`
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledCalendarEventDateCardDay = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

type EventCardCalendarEventProps = {
  calendarEvent: TimelineCalendarEventRecord;
  isOpen: boolean;
};

export const EventCardCalendarEvent = ({
  calendarEvent,
  isOpen,
}: EventCardCalendarEventProps) => {
  const theme = useTheme();
  const { openCalendarEventInSidePanel } = useOpenCalendarEventInSidePanel();
  const { timeZone } = useContext(UserContext);

  const participants = calendarEvent.calendarEventParticipants ?? [];
  const organizer = participants.find((participant) => participant.isOrganizer);
  const organizerName = isDefined(organizer)
    ? getCalendarEventParticipantName(organizer)
    : undefined;

  const startsAtTime = formatToHumanReadableTime(
    calendarEvent.startsAt,
    timeZone,
  );
  const endsAtTime = isDefined(calendarEvent.endsAt)
    ? formatToHumanReadableTime(calendarEvent.endsAt, timeZone)
    : undefined;
  const timeLabel = calendarEvent.isFullDay
    ? t`All day`
    : isDefined(endsAtTime)
      ? `${startsAtTime} → ${endsAtTime}`
      : startsAtTime;
  const subtitle = isDefined(organizerName)
    ? t`${timeLabel} · Organized by ${organizerName}`
    : timeLabel;

  const conferenceLinkUrl = calendarEvent.conferenceLink?.primaryLinkUrl;
  const conferenceLinkLabel = calendarEvent.conferenceLink?.primaryLinkLabel;
  // Google stores the Meet URL as the link label and often as the location too
  const location =
    calendarEvent.location === conferenceLinkUrl
      ? ''
      : (calendarEvent.location ?? '');

  return (
    <StyledEventCardCalendarEventContainer>
      <StyledCalendarEventDateCard>
        <StyledCalendarEventDateCardMonth>
          {formatToHumanReadableMonth(calendarEvent.startsAt, timeZone)}
        </StyledCalendarEventDateCardMonth>
        <StyledCalendarEventDateCardDay>
          {formatToHumanReadableDay(calendarEvent.startsAt, timeZone)}
        </StyledCalendarEventDateCardDay>
      </StyledCalendarEventDateCard>
      <StyledCalendarEventContent>
        <StyledCalendarEventTop>
          <StyledCalendarEventTitle
            isCanceled={calendarEvent.isCanceled === true}
            onClick={() => openCalendarEventInSidePanel(calendarEvent.id)}
          >
            {isNonEmptyString(calendarEvent.title)
              ? calendarEvent.title
              : t`Untitled meeting`}
          </StyledCalendarEventTitle>
          {(isNonEmptyArray(participants) ||
            isNonEmptyArray(calendarEvent.callRecordings)) && (
            <CalendarEventParticipantsAvatarGroup
              participants={participants}
              callRecordings={calendarEvent.callRecordings ?? []}
            />
          )}
        </StyledCalendarEventTop>
        <StyledCalendarEventSubtitle>{subtitle}</StyledCalendarEventSubtitle>
        {isNonEmptyString(conferenceLinkUrl) && (
          <StyledConferenceLink
            href={conferenceLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconVideo size={theme.icon.size.sm} />
            {isNonEmptyString(conferenceLinkLabel) &&
            conferenceLinkLabel !== conferenceLinkUrl
              ? conferenceLinkLabel
              : t`Join meeting`}
          </StyledConferenceLink>
        )}
        <CalendarEventRowDetails
          calendarEvent={{ ...calendarEvent, location }}
        />
        {isOpen && isNonEmptyArray(participants) && (
          <>
            <StyledSectionLabel>{t`Attendees`}</StyledSectionLabel>
            <StyledAttendees>
              {participants.map((participant) => (
                <ParticipantChip
                  key={participant.id}
                  participant={participant}
                />
              ))}
            </StyledAttendees>
          </>
        )}
        {isOpen && isNonEmptyString(calendarEvent.description) && (
          <StyledDescription>{calendarEvent.description}</StyledDescription>
        )}
      </StyledCalendarEventContent>
    </StyledEventCardCalendarEventContainer>
  );
};
