import { gql } from '@apollo/client';

export const CLONE_PIPELINE = gql`
  mutation ClonePipeline($pipelineId: UUID!) {
    clonePipeline(pipelineId: $pipelineId)
  }
`;

export type ClonePipelineMutationResult = {
  clonePipeline: string;
};

export type ClonePipelineMutationVariables = {
  pipelineId: string;
};
