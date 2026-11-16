import { type PipelineBoardScope } from '@/pipeline/board/types/PipelineBoardScope';
import { isDefined } from 'twenty-shared/utils';

export const isPipelineBoardDropAllowed = ({
  scope,
  targetStageValue,
}: {
  scope: PipelineBoardScope | null;
  targetStageValue: string | null | undefined;
}) =>
  !isDefined(scope) ||
  (isDefined(targetStageValue) && scope.stageValues.includes(targetStageValue));
