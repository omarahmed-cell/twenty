import { type StepFilter, type StepFilterGroup } from 'twenty-shared/types';

import { resolveStepFilters } from 'src/modules/workflow/workflow-executor/utils/resolve-step-filters.util';

import {
  evaluateFilterConditions,
  type TeamMemberIdsByTeamId,
} from 'src/modules/workflow/workflow-executor/workflow-actions/filter/utils/evaluate-filter-conditions.util';

export const evaluateStepFilters = ({
  stepFilters,
  stepFilterGroups,
  context,
  teamMemberIdsByTeamId,
}: {
  stepFilters: StepFilter[];
  stepFilterGroups: StepFilterGroup[];
  context: Record<string, unknown>;
  teamMemberIdsByTeamId?: TeamMemberIdsByTeamId;
}): boolean => {
  const resolvedFilters = resolveStepFilters({ stepFilters, context });

  return evaluateFilterConditions({
    filterGroups: stepFilterGroups,
    filters: resolvedFilters,
    teamMemberIdsByTeamId,
  });
};
