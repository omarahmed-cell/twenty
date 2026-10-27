import { type Meta, type StoryObj } from '@storybook/react-vite';
import { HttpResponse, graphql } from 'msw';
import { within } from 'storybook/test';
import { FIELD_RESTRICTED_ADDITIONAL_PERMISSIONS_REQUIRED } from 'twenty-shared/constants';
import { ComponentDecorator } from 'twenty-ui/testing';

import { TimelineActivityContext } from '@/activities/timeline-activities/contexts/TimelineActivityContext';
import { EventRowMessage } from '@/activities/timeline-activities/rows/message/components/EventRowMessage';
import { MemoryRouterDecorator } from '~/testing/decorators/MemoryRouterDecorator';
import { ObjectMetadataItemsDecorator } from '~/testing/decorators/ObjectMetadataItemsDecorator';
import { ToastDecorator } from '~/testing/decorators/ToastDecorator';

const meta: Meta<typeof EventRowMessage> = {
  title: 'Modules/TimelineActivities/Rows/Message/EventRowMessage',
  component: EventRowMessage,
  decorators: [
    MemoryRouterDecorator,
    ComponentDecorator,
    ObjectMetadataItemsDecorator,
    ToastDecorator,
    (Story) => (
      <TimelineActivityContext.Provider value={{ recordId: 'mock-id' }}>
        <Story />
      </TimelineActivityContext.Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EventRowMessage>;

export const Default: Story = {
  args: {
    messageId: '1',
    authorFullName: 'John Doe',
    happensAt: '2026-10-27T12:17:30.401Z',
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Mock title');
  },
  parameters: {
    msw: {
      handlers: [
        graphql.query('GetTimelineChannelOwners', () =>
          HttpResponse.json({ data: { getTimelineChannelOwners: [] } }),
        ),
        graphql.query('FindOneMessage', () =>
          HttpResponse.json({
            data: {
              message: {
                id: '1',
                subject: 'Mock title',
                text: 'Mock body',
                messageParticipants: [],
                messageChannelMessageAssociations: [],
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
    messageId: '1',
    authorFullName: 'John Doe',
    happensAt: '2026-10-27T12:17:30.401Z',
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Subject not shared');
  },
  parameters: {
    msw: {
      handlers: [
        graphql.query('GetTimelineChannelOwners', () =>
          HttpResponse.json({ data: { getTimelineChannelOwners: [] } }),
        ),
        graphql.query('FindOneMessage', () =>
          HttpResponse.json({
            data: {
              message: {
                id: '1',
                subject: FIELD_RESTRICTED_ADDITIONAL_PERMISSIONS_REQUIRED,
                text: FIELD_RESTRICTED_ADDITIONAL_PERMISSIONS_REQUIRED,
                messageParticipants: [],
                messageChannelMessageAssociations: [],
              },
            },
          }),
        ),
      ],
    },
  },
};
