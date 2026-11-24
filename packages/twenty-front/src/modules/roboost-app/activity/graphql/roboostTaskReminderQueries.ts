import { gql } from '@apollo/client';

export const ROBOOST_SET_TASK_REMINDER = gql`
  mutation RoboostSetTaskReminder(
    $taskId: String!
    $offset: String!
    $customAt: String
  ) {
    roboostSetTaskReminder(
      taskId: $taskId
      offset: $offset
      customAt: $customAt
    )
  }
`;
