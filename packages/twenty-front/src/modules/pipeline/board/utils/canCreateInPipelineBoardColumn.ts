import { type PipelineBoardScope } from '@/pipeline/board/types/PipelineBoardScope';
import { isDealCreationStageAllowed, isDefined } from 'twenty-shared/utils';

// The "+" only shows on columns a new deal may start in, unless the viewer is an Admin
export const canCreateInPipelineBoardColumn = ({
  scope,
  isAdmin,
  stageValue,
}: {
  scope: PipelineBoardScope | null;
  isAdmin: boolean;
  stageValue: string | null | undefined;
}) =>
  isAdmin ||
  !isDefined(scope) ||
  !isDefined(stageValue) ||
  isDealCreationStageAllowed({ rules: scope.pipeline.rules, stageValue });
