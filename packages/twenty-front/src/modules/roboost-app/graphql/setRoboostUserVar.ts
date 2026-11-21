import { gql } from '@apollo/client';

export const SET_ROBOOST_USER_VAR = gql`
  mutation SetRoboostUserVar($key: String!, $value: JSON) {
    setRoboostUserVar(key: $key, value: $value)
  }
`;
