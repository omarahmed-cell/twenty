import { type PipelineBoardScope } from '@/pipeline/board/types/PipelineBoardScope';
import { PIPELINE_BOARD_PIPELINE_FIELD_NAME } from '@/pipeline/board/utils/buildPipelineBoardRecordFilter';
import { isDefined } from 'twenty-shared/utils';

// A deal created from a column lands in the board's pipeline as well as the column's stage
export const getPipelineBoardCreateRecordDefaults = (
  scope: PipelineBoardScope | null,
): Record<string, string> =>
  isDefined(scope)
    ? { [PIPELINE_BOARD_PIPELINE_FIELD_NAME]: scope.pipelineKey }
    : {};
