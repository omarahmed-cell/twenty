import { useQuery } from '@apollo/client/react';
import { isDefined } from 'twenty-shared/utils';

import {
  IS_PIPELINE_ADMIN,
  type IsPipelineAdminQueryResult,
} from '@/pipeline/rules/graphql/IsPipelineAdminQuery';
import { useHasPipelineObjects } from '@/pipeline/hooks/useHasPipelineObjects';

export const usePipelineAdminStatus = ({
  skip = false,
}: { skip?: boolean } = {}) => {
  const hasPipelineObjects = useHasPipelineObjects();

  const { data } = useQuery<IsPipelineAdminQueryResult>(IS_PIPELINE_ADMIN, {
    skip: skip || !hasPipelineObjects,
    fetchPolicy: 'cache-first',
  });

  return {
    isAdmin: data?.isPipelineAdmin === true,
    isLoaded: isDefined(data),
  };
};

// Until the answer arrives the viewer is treated as bound by the rules; the server decides either way
export const useIsPipelineAdmin = ({ skip = false }: { skip?: boolean } = {}) =>
  usePipelineAdminStatus({ skip }).isAdmin;
