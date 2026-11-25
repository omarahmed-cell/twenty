import { gql } from '@apollo/client';

export const ROBOOST_DUPLICATE_OVERVIEW = gql`
  query RoboostDuplicateOverview($objectName: String!) {
    roboostDuplicateOverview(objectName: $objectName)
  }
`;

export const ROBOOST_DUPLICATE_PAIRS = gql`
  query RoboostDuplicatePairs(
    $objectName: String!
    $status: String!
    $confidence: String
    $search: String
    $sort: String
    $offset: Int
    $limit: Int
  ) {
    roboostDuplicatePairs(
      objectName: $objectName
      status: $status
      confidence: $confidence
      search: $search
      sort: $sort
      offset: $offset
      limit: $limit
    )
  }
`;

export const ROBOOST_SCAN_DUPLICATES = gql`
  mutation RoboostScanDuplicates($objectName: String!) {
    roboostScanDuplicates(objectName: $objectName)
  }
`;

export const ROBOOST_SAVE_DUPLICATE_RULES = gql`
  mutation RoboostSaveDuplicateRules(
    $objectName: String!
    $rules: JSON!
    $similarityThreshold: Float
  ) {
    roboostSaveDuplicateRules(
      objectName: $objectName
      rules: $rules
      similarityThreshold: $similarityThreshold
    )
  }
`;

export const ROBOOST_SET_DUPLICATE_PAIR_REJECTED = gql`
  mutation RoboostSetDuplicatePairRejected(
    $pairId: String!
    $isRejected: Boolean!
  ) {
    roboostSetDuplicatePairRejected(pairId: $pairId, isRejected: $isRejected)
  }
`;

export const ROBOOST_BULK_MERGE_PREVIEW = gql`
  query RoboostBulkMergePreview($objectName: String!, $pairIds: [String!]) {
    roboostBulkMergePreview(objectName: $objectName, pairIds: $pairIds)
  }
`;

export const ROBOOST_START_BULK_MERGE = gql`
  mutation RoboostStartBulkMerge(
    $objectName: String!
    $objectNamePlural: String!
    $pairIds: [String!]!
  ) {
    roboostStartBulkMerge(
      objectName: $objectName
      objectNamePlural: $objectNamePlural
      pairIds: $pairIds
    )
  }
`;

export const ROBOOST_BULK_MERGES = gql`
  query RoboostBulkMerges($objectName: String!) {
    roboostBulkMerges(objectName: $objectName)
  }
`;

export const ROBOOST_CHECK_IMPORTED_DUPLICATES = gql`
  mutation RoboostCheckImportedDuplicates(
    $objectName: String!
    $importId: String
    $recordIds: [String!]!
  ) {
    roboostCheckImportedDuplicates(
      objectName: $objectName
      importId: $importId
      recordIds: $recordIds
    )
  }
`;

export const ROBOOST_MERGE_HISTORY_CSV = gql`
  query RoboostMergeHistoryCsv($objectName: String!) {
    roboostMergeHistoryCsv(objectName: $objectName)
  }
`;
