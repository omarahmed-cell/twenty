import { gql } from '@apollo/client';

export const RESYNC_SYNC_FIELD = gql`
  mutation ResyncSyncField($fieldMetadataId: UUID!) {
    resyncSyncField(fieldMetadataId: $fieldMetadataId)
  }
`;
