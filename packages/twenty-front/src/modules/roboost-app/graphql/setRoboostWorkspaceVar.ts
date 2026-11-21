import { gql } from '@apollo/client';

export const SET_ROBOOST_WORKSPACE_VAR = gql`
  mutation SetRoboostWorkspaceVar($key: String!, $value: JSON) {
    setRoboostWorkspaceVar(key: $key, value: $value)
  }
`;
