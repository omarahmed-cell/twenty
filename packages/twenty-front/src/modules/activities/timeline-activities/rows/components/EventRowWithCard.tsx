import { type ReactNode } from 'react';

import { EventCard } from '@/activities/timeline-activities/rows/components/EventCard';
import { EventCardToggleButton } from '@/activities/timeline-activities/rows/components/EventCardToggleButton';
import { EventRowDate } from '@/activities/timeline-activities/rows/components/EventRowDate';
import { EventRowItem } from '@/activities/timeline-activities/rows/components/EventRowItem';
import {
  StyledEventRow,
  StyledEventRowContainer,
  StyledEventRowContent,
} from '@/activities/timeline-activities/rows/components/EventRowStyles';
import { isDefined } from 'twenty-shared/utils';
import { OverflowingTextWithTooltip } from 'twenty-ui/primitives/typography';

type EventRowWithCardProps = {
  actorName: string;
  actionLabel: string;
  happensAt?: string;
  isOpen: boolean;
  onToggle?: (isOpen: boolean) => void;
  children: ReactNode;
};

export const EventRowWithCard = ({
  actorName,
  actionLabel,
  happensAt,
  isOpen,
  onToggle,
  children,
}: EventRowWithCardProps) => (
  <StyledEventRow>
    <StyledEventRowContainer>
      <StyledEventRowContent>
        <EventRowItem>{actorName}</EventRowItem>
        <EventRowItem variant="action">
          <OverflowingTextWithTooltip text={actionLabel} />
        </EventRowItem>
        {isDefined(onToggle) && (
          <EventCardToggleButton isOpen={isOpen} setIsOpen={onToggle} />
        )}
      </StyledEventRowContent>
      <EventRowDate happensAt={happensAt} />
    </StyledEventRowContainer>
    <EventCard isOpen>{children}</EventCard>
  </StyledEventRow>
);
