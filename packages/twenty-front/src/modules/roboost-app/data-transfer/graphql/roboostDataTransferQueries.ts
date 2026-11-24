import { gql } from '@apollo/client';

export const ROBOOST_LOG_EXPORT = gql`
  mutation RoboostLogExport(
    $name: String!
    $source: String!
    $objectNameSingular: String
    $recordCount: Int!
    $fileName: String!
    $content: String!
  ) {
    roboostLogExport(
      name: $name
      source: $source
      objectNameSingular: $objectNameSingular
      recordCount: $recordCount
      fileName: $fileName
      content: $content
    ) {
      id
    }
  }
`;

export const ROBOOST_EXPORTS = gql`
  query RoboostExports(
    $search: String
    $sortDirection: String
    $page: Int
    $pageSize: Int
  ) {
    roboostExports(
      search: $search
      sortDirection: $sortDirection
      page: $page
      pageSize: $pageSize
    ) {
      total
      items {
        id
        name
        source
        objectNameSingular
        recordCount
        userName
        userEmail
        fileName
        isAvailable
        createdAt
      }
    }
  }
`;

export const ROBOOST_EXPORT_FILE = gql`
  query RoboostExportFile($id: String!) {
    roboostExportFile(id: $id) {
      fileName
      content
    }
  }
`;

export const ROBOOST_START_IMPORT = gql`
  mutation RoboostStartImport($name: String!, $objectNameSingular: String!) {
    roboostStartImport(name: $name, objectNameSingular: $objectNameSingular)
  }
`;

export const ROBOOST_FINISH_IMPORT = gql`
  mutation RoboostFinishImport(
    $id: String!
    $state: String!
    $newCount: Int!
    $updatedCount: Int!
    $newAssociations: Int!
    $errorCount: Int!
    $errorFile: String
    $recordIds: [String!]!
  ) {
    roboostFinishImport(
      id: $id
      state: $state
      newCount: $newCount
      updatedCount: $updatedCount
      newAssociations: $newAssociations
      errorCount: $errorCount
      errorFile: $errorFile
      recordIds: $recordIds
    ) {
      id
    }
  }
`;

export const ROBOOST_RENAME_IMPORT = gql`
  mutation RoboostRenameImport($id: String!, $name: String!) {
    roboostRenameImport(id: $id, name: $name) {
      id
      name
    }
  }
`;

export const ROBOOST_IMPORTS = gql`
  query RoboostImports(
    $search: String
    $objectNameSingular: String
    $state: String
    $createdById: String
    $createdFrom: String
    $createdTo: String
    $page: Int
    $pageSize: Int
  ) {
    roboostImports(
      search: $search
      objectNameSingular: $objectNameSingular
      state: $state
      createdById: $createdById
      createdFrom: $createdFrom
      createdTo: $createdTo
      page: $page
      pageSize: $pageSize
    ) {
      total
      items {
        id
        name
        objectNameSingular
        state
        newCount
        updatedCount
        newAssociations
        errorCount
        hasErrorFile
        workspaceMemberId
        createdByName
        createdAt
      }
    }
  }
`;

export const ROBOOST_IMPORT_ERROR_FILE = gql`
  query RoboostImportErrorFile($id: String!) {
    roboostImportErrorFile(id: $id) {
      fileName
      content
    }
  }
`;

export const ROBOOST_IMPORT_OPTIONS = gql`
  query RoboostImportOptions($objectNameSingular: String!) {
    roboostImportOptions(objectNameSingular: $objectNameSingular) {
      id
      name
    }
  }
`;

export const ROBOOST_IMPORT_RECORD_IDS = gql`
  query RoboostImportRecordIds(
    $importIds: [String!]!
    $objectNameSingular: String!
  ) {
    roboostImportRecordIds(
      importIds: $importIds
      objectNameSingular: $objectNameSingular
    )
  }
`;
