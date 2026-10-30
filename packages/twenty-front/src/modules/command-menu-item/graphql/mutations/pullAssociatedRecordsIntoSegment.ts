import gql from 'graphql-tag';

export const PULL_ASSOCIATED_RECORDS_INTO_SEGMENT = gql`
  mutation PullAssociatedRecordsIntoSegment(
    $input: PullAssociatedRecordsIntoSegmentInput!
  ) {
    pullAssociatedRecordsIntoSegment(input: $input) {
      targetSegmentId
      addedRecordCount
      removedRecordCount
      memberCount
    }
  }
`;
