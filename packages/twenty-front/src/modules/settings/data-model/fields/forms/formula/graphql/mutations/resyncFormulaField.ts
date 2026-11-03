import { gql } from '@apollo/client';

export const RESYNC_FORMULA_FIELD = gql`
  mutation ResyncFormulaField($fieldMetadataId: UUID!) {
    resyncFormulaField(fieldMetadataId: $fieldMetadataId)
  }
`;
