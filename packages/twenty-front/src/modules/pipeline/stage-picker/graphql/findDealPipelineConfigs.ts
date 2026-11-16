import { gql } from '@apollo/client';

export const FIND_DEAL_PIPELINE_CONFIGS = gql`
  query FindDealPipelineConfigs {
    pipelines(first: 200, orderBy: [{ position: AscNullsLast }]) {
      edges {
        node {
          id
          key
          name
          description
          position
          objectNameSingular
          rules
          deletedAt
        }
      }
    }
    pipelineStages(first: 800, orderBy: [{ position: AscNullsLast }]) {
      edges {
        node {
          id
          pipelineId
          label
          value
          position
          color
          probability
          hubspotStageId
          calcPropsEnabled
          conditionalRules
          deletedAt
        }
      }
    }
  }
`;
