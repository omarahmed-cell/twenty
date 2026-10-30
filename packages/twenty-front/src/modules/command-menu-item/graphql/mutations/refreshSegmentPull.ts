import gql from 'graphql-tag';

export const REFRESH_SEGMENT_PULL = gql`
  mutation RefreshSegmentPull($input: RefreshSegmentPullInput!) {
    refreshSegmentPull(input: $input) {
      targetSegmentId
      addedRecordCount
      removedRecordCount
      memberCount
    }
  }
`;
