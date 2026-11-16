import { type PipelineBoardScope } from '@/pipeline/board/types/PipelineBoardScope';
import {
  type RecordGqlOperationFilter,
  type SelectFilter,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const PIPELINE_BOARD_PIPELINE_FIELD_NAME = 'pipeline';

export const buildPipelineBoardRecordFilter = (
  scope: PipelineBoardScope | null,
): RecordGqlOperationFilter =>
  isDefined(scope)
    ? {
        [PIPELINE_BOARD_PIPELINE_FIELD_NAME]: {
          in: [scope.pipelineKey],
        } satisfies SelectFilter,
      }
    : {};
