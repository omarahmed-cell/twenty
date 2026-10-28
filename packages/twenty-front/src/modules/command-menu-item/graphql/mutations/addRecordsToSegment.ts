import gql from 'graphql-tag';

export const ADD_RECORDS_TO_SEGMENT = gql`
  mutation AddRecordsToSegment($input: UpdateSegmentMembershipInput!) {
    addRecordsToSegment(input: $input) {
      affectedRecordCount
      memberCount
    }
  }
`;
