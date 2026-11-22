import { gql } from '@apollo/client';

export const FIND_RECORD_LAYOUTS = gql`
  query FindRoboostRecordLayouts {
    recordLayouts(first: 500) {
      edges {
        node {
          id
          objectMetadataId
          roleId
          teamId
          layout
        }
      }
    }
  }
`;

export const CREATE_RECORD_LAYOUT = gql`
  mutation CreateRoboostRecordLayout($data: RecordLayoutCreateInput!) {
    createRecordLayout(data: $data) {
      id
      objectMetadataId
      roleId
      teamId
      layout
    }
  }
`;

export const UPDATE_RECORD_LAYOUT = gql`
  mutation UpdateRoboostRecordLayout(
    $id: UUID!
    $data: RecordLayoutUpdateInput!
  ) {
    updateRecordLayout(id: $id, data: $data) {
      id
      objectMetadataId
      roleId
      teamId
      layout
    }
  }
`;
