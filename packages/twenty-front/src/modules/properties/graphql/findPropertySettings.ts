import { gql } from '@apollo/client';

export const FIND_PROPERTY_SETTINGS = gql`
  query FindPropertySettings {
    propertyGroups(first: 500, orderBy: [{ position: AscNullsLast }]) {
      edges {
        node {
          id
          name
          objectMetadataId
          position
        }
      }
    }
    propertyGroupMemberships(
      first: 2000
      orderBy: [{ position: AscNullsLast }]
    ) {
      edges {
        node {
          id
          propertyGroupId
          fieldMetadataId
          objectMetadataId
          position
        }
      }
    }
    propertyLogicRules(first: 500, orderBy: [{ position: AscNullsLast }]) {
      edges {
        node {
          id
          objectMetadataId
          conditionGroups
          properties
          position
          createdAt
          createdBy {
            source
            workspaceMemberId
            name
          }
        }
      }
    }
    propertyCreations(first: 2000) {
      edges {
        node {
          id
          fieldMetadataId
          objectMetadataId
          createdAt
          createdBy {
            source
            workspaceMemberId
            name
          }
        }
      }
    }
  }
`;
