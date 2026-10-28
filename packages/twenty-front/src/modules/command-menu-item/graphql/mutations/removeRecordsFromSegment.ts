import gql from 'graphql-tag';

export const REMOVE_RECORDS_FROM_SEGMENT = gql`
  mutation RemoveRecordsFromSegment($input: UpdateSegmentMembershipInput!) {
    removeRecordsFromSegment(input: $input) {
      affectedRecordCount
      memberCount
    }
  }
`;
