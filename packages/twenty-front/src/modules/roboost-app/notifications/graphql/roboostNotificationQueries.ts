import { gql } from '@apollo/client';

export const ROBOOST_NOTIFICATIONS = gql`
  query RoboostNotifications(
    $tab: String!
    $type: String
    $before: String
    $limit: Int
  ) {
    roboostNotifications(
      tab: $tab
      type: $type
      before: $before
      limit: $limit
    ) {
      hasMore
      items {
        id
        type
        subtype
        title
        body
        actorName
        targetObjectNameSingular
        targetRecordId
        targetPath
        downloadUrl
        actionLabel
        relatedRecords
        relatedCount
        isRead
        isTrashed
        createdAt
      }
    }
  }
`;

export const ROBOOST_NOTIFICATION_COUNTS = gql`
  query RoboostNotificationCounts {
    roboostNotificationCounts {
      unread
      all
      trash
    }
  }
`;

export const ROBOOST_UPDATE_NOTIFICATIONS = gql`
  mutation RoboostUpdateNotifications(
    $action: String!
    $ids: [String!]
    $allInTab: String
    $type: String
  ) {
    roboostUpdateNotifications(
      action: $action
      ids: $ids
      allInTab: $allInTab
      type: $type
    )
  }
`;
