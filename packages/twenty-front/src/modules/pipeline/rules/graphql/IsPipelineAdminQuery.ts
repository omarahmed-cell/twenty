import { gql } from '@apollo/client';

export const IS_PIPELINE_ADMIN = gql`
  query IsPipelineAdmin {
    isPipelineAdmin
  }
`;

export type IsPipelineAdminQueryResult = {
  isPipelineAdmin: boolean;
};
