import { gql } from '@apollo/client';

export const getTimelineChannelOwners = gql`
  query GetTimelineChannelOwners {
    getTimelineChannelOwners {
      channelId
      workspaceMemberId
    }
  }
`;
