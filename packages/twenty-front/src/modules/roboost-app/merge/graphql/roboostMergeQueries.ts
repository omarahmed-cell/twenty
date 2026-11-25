import { gql } from '@apollo/client';

export const ROBOOST_MERGE_CANDIDATES = gql`
  query RoboostMergeCandidates(
    $objectName: String!
    $excludeId: String!
    $search: String!
  ) {
    roboostMergeCandidates(
      objectName: $objectName
      excludeId: $excludeId
      search: $search
    ) {
      id
      name
      keyText
      createdAt
    }
  }
`;

export const ROBOOST_MERGE_PREVIEW = gql`
  query RoboostMergePreview(
    $objectName: String!
    $primaryId: String!
    $secondaryId: String!
  ) {
    roboostMergePreview(
      objectName: $objectName
      primaryId: $primaryId
      secondaryId: $secondaryId
    )
  }
`;

export const ROBOOST_MERGE_RECORDS = gql`
  mutation RoboostMergeRecords(
    $objectName: String!
    $primaryId: String!
    $secondaryId: String!
    $secondaryFieldNames: [String!]!
  ) {
    roboostMergeRecords(
      objectName: $objectName
      primaryId: $primaryId
      secondaryId: $secondaryId
      secondaryFieldNames: $secondaryFieldNames
    )
  }
`;

export const ROBOOST_MERGED_INTO = gql`
  query RoboostMergedInto($objectName: String!, $recordId: String!) {
    roboostMergedInto(objectName: $objectName, recordId: $recordId) {
      primaryId
      primaryName
    }
  }
`;

export const ROBOOST_MERGE_HISTORY = gql`
  query RoboostMergeHistory($objectName: String!, $recordId: String!) {
    roboostMergeHistory(objectName: $objectName, recordId: $recordId) {
      canUnmerge
      merges
    }
  }
`;

export const ROBOOST_UNMERGE_PREVIEW = gql`
  query RoboostUnmergePreview($mergeId: String!) {
    roboostUnmergePreview(mergeId: $mergeId)
  }
`;

export const ROBOOST_UNMERGE = gql`
  mutation RoboostUnmerge(
    $mergeId: String!
    $keepCurrentFieldNames: [String!]!
  ) {
    roboostUnmerge(
      mergeId: $mergeId
      keepCurrentFieldNames: $keepCurrentFieldNames
    )
  }
`;
