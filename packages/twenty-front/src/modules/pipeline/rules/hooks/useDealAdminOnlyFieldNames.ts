import { useIsPipelineAdmin } from '@/pipeline/rules/hooks/useIsPipelineAdmin';
import { getDealAdminOnlyFieldNamesForViewer } from '@/pipeline/rules/utils/isDealFieldAdminOnly';
import { CoreObjectNameSingular } from 'twenty-shared/types';

export const useDealAdminOnlyFieldNames = (
  objectNameSingular: string | undefined,
): string[] => {
  const isAdmin = useIsPipelineAdmin({
    skip: objectNameSingular !== CoreObjectNameSingular.Opportunity,
  });

  return getDealAdminOnlyFieldNamesForViewer({ objectNameSingular, isAdmin });
};
