import { gql } from '@apollo/client';

export const ROBOOST_SCORE_FIELDS = gql`
  fragment RoboostScoreFields on RoboostScore {
    id
    name
    description
    objectName
    isActive
    scoreMin
    scoreMax
    linkedFieldMetadataId
    freezeOnClosedWon
    publishedVersionNumber
    draft
    hasDraftChanges
    recalcStatus
    recalcTotal
    recalcDone
    recalcFinishedAt
    lastFullRecalcAt
    lastVerifiedAt
    lastDriftCount
    createdAt
    createdByName
    updatedAt
    updatedByName
  }
`;

export const ROBOOST_SCORES = gql`
  ${ROBOOST_SCORE_FIELDS}
  query RoboostScores {
    roboostScores {
      ...RoboostScoreFields
    }
    roboostScoringCanEdit
  }
`;

export const ROBOOST_SCORE = gql`
  ${ROBOOST_SCORE_FIELDS}
  query RoboostScore($scoreId: String!) {
    roboostScore(scoreId: $scoreId) {
      ...RoboostScoreFields
    }
    roboostScoringCanEdit
  }
`;

export const ROBOOST_SCORE_ELIGIBLE_FIELDS = gql`
  query RoboostScoreEligibleFields($objectName: String!) {
    roboostScoreEligibleFields(objectName: $objectName) {
      id
      label
      name
    }
  }
`;

export const ROBOOST_SCORE_VERSIONS = gql`
  query RoboostScoreVersions($scoreId: String!) {
    roboostScoreVersions(scoreId: $scoreId) {
      id
      version
      criteria
      publishedAt
      publishedByName
      note
    }
  }
`;

export const ROBOOST_TEST_SCORE = gql`
  query RoboostTestScore(
    $scoreId: String!
    $criteria: JSON!
    $recordId: String!
  ) {
    roboostTestScore(
      scoreId: $scoreId
      criteria: $criteria
      recordId: $recordId
    )
  }
`;

export const ROBOOST_EXPLAIN_SCORE = gql`
  query RoboostExplainScore($fieldMetadataId: String!, $recordId: String!) {
    roboostExplainScore(
      fieldMetadataId: $fieldMetadataId
      recordId: $recordId
    ) {
      scoreId
      scoreName
      value
      versionNumber
      computedAt
      frozen
      frozenAt
      source
      breakdown
      criteria
      isActive
    }
  }
`;

export const ROBOOST_CREATE_SCORE = gql`
  ${ROBOOST_SCORE_FIELDS}
  mutation RoboostCreateScore(
    $name: String!
    $objectName: String!
    $propertyMode: String!
    $propertyLabel: String
    $fieldMetadataId: String
    $cloneFromScoreId: String
    $defaultGroupName: String
  ) {
    roboostCreateScore(
      name: $name
      objectName: $objectName
      propertyMode: $propertyMode
      propertyLabel: $propertyLabel
      fieldMetadataId: $fieldMetadataId
      cloneFromScoreId: $cloneFromScoreId
      defaultGroupName: $defaultGroupName
    ) {
      ...RoboostScoreFields
    }
  }
`;

export const ROBOOST_SAVE_SCORE = gql`
  ${ROBOOST_SCORE_FIELDS}
  mutation RoboostSaveScore(
    $scoreId: String!
    $draft: JSON
    $name: String
    $description: String
    $freezeOnClosedWon: Boolean
  ) {
    roboostSaveScore(
      scoreId: $scoreId
      draft: $draft
      name: $name
      description: $description
      freezeOnClosedWon: $freezeOnClosedWon
    ) {
      ...RoboostScoreFields
    }
  }
`;

export const ROBOOST_PUBLISH_SCORE = gql`
  ${ROBOOST_SCORE_FIELDS}
  mutation RoboostPublishScore(
    $scoreId: String!
    $draft: JSON!
    $note: String
  ) {
    roboostPublishScore(scoreId: $scoreId, draft: $draft, note: $note) {
      ...RoboostScoreFields
    }
  }
`;

export const ROBOOST_SET_SCORE_ACTIVE = gql`
  ${ROBOOST_SCORE_FIELDS}
  mutation RoboostSetScoreActive($scoreId: String!, $isActive: Boolean!) {
    roboostSetScoreActive(scoreId: $scoreId, isActive: $isActive) {
      ...RoboostScoreFields
    }
  }
`;

export const ROBOOST_RECALCULATE_SCORE = gql`
  ${ROBOOST_SCORE_FIELDS}
  mutation RoboostRecalculateScore($scoreId: String!) {
    roboostRecalculateScore(scoreId: $scoreId) {
      ...RoboostScoreFields
    }
  }
`;

export const ROBOOST_DELETE_SCORE = gql`
  mutation RoboostDeleteScore($scoreId: String!, $deleteProperty: Boolean!) {
    roboostDeleteScore(scoreId: $scoreId, deleteProperty: $deleteProperty)
  }
`;

export const ROBOOST_CHANGE_SCORE_PROPERTY = gql`
  ${ROBOOST_SCORE_FIELDS}
  mutation RoboostChangeScoreProperty(
    $scoreId: String!
    $propertyMode: String!
    $propertyLabel: String
    $fieldMetadataId: String
  ) {
    roboostChangeScoreProperty(
      scoreId: $scoreId
      propertyMode: $propertyMode
      propertyLabel: $propertyLabel
      fieldMetadataId: $fieldMetadataId
    ) {
      ...RoboostScoreFields
    }
  }
`;

export const ROBOOST_RESTORE_SCORE_VERSION = gql`
  ${ROBOOST_SCORE_FIELDS}
  mutation RoboostRestoreScoreVersion($scoreId: String!, $versionId: String!) {
    roboostRestoreScoreVersion(scoreId: $scoreId, versionId: $versionId) {
      ...RoboostScoreFields
    }
  }
`;
