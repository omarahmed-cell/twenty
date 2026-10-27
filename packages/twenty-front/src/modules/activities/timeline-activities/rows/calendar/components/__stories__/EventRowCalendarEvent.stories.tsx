import { type Meta, type StoryObj } from '@storybook/react-vite';
import { HttpResponse, graphql } from 'msw';
import { ComponentDecorator } from 'twenty-ui/testing';

import { EventRowCalendarEvent } from '@/activities/timeline-activities/rows/calendar/components/EventRowCalendarEvent';
import { MemoryRouterDecorator } from '~/testing/decorators/MemoryRouterDecorator';
import { ObjectMetadataItemsDecorator } from '~/testing/decorators/ObjectMetadataItemsDecorator';
import { ToastDecorator } from '~/testing/decorators/ToastDecorator';

const meta: Meta<typeof EventRowCalendarEvent> = {
  title: 'Modules/TimelineActivities/Rows/CalendarEvent/EventRowCalendarEvent',
  component: EventRowCalendarEvent,
  decorators: [
    MemoryRouterDecorator,
    ComponentDecorator,
    ObjectMetadataItemsDecorator,
    ToastDecorator,
  ],
};

export default meta;
type Story = StoryObj<typeof EventRowCalendarEvent>;

export const Default: Story = {
  args: {
    calendarEventId: '1',
    authorFullName: 'John Doe',
    happensAt: '2022-01-01T00:00:00Z',
  },
  parameters: {
    msw: {
      handlers: [
        graphql.query('GetTimelineChannelOwners', () =>
          HttpResponse.json({ data: { getTimelineChannelOwners: [] } }),
        ),
        graphql.query('FindOneCalendarEvent', () =>
          HttpResponse.json({
            data: {
              calendarEvent: {
                id: '1',
                title: 'Mock title',
                startsAt: '2022-01-01T00:00:00Z',
                endsAt: '2022-01-01T01:00:00Z',
                calendarEventParticipants: [],
                calendarChannelEventAssociations: [],
              },
            },
          }),
        ),
      ],
    },
  },
};

export const NotShared: Story = {
  args: {
    calendarEventId: '1',
    authorFullName: 'John Doe',
    happensAt: '2022-01-01T00:00:00Z',
  },
  parameters: {
    msw: {
      handlers: [
        graphql.query('GetTimelineChannelOwners', () =>
          HttpResponse.json({ data: { getTimelineChannelOwners: [] } }),
        ),
        graphql.query('FindOneCalendarEvent', () =>
          HttpResponse.json({
            errors: [
              {
                message: 'Forbidden',
                extensions: { code: 'FORBIDDEN' },
              },
            ],
          }),
        ),
      ],
    },
  },
};
