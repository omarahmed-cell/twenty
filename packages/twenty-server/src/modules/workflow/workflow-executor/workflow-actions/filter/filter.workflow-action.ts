import { Injectable } from '@nestjs/common';

import { RoboostRecordVisibilityService } from 'src/engine/metadata-modules/role/services/roboost-record-visibility.service';
import { type WorkflowAction } from 'src/modules/workflow/workflow-executor/interfaces/workflow-action.interface';

import {
  WorkflowStepExecutorException,
  WorkflowStepExecutorExceptionCode,
} from 'src/modules/workflow/workflow-executor/exceptions/workflow-step-executor.exception';
import { type WorkflowActionInput } from 'src/modules/workflow/workflow-executor/types/workflow-action-input.type';
import { type WorkflowActionOutput } from 'src/modules/workflow/workflow-executor/types/workflow-action-output.type';
import { findStepOrThrow } from 'src/modules/workflow/workflow-executor/utils/find-step-or-throw.util';
import { isWorkflowFilterAction } from 'src/modules/workflow/workflow-executor/workflow-actions/filter/guards/is-workflow-filter-action.guard';
import { evaluateStepFilters } from 'src/modules/workflow/workflow-executor/workflow-actions/filter/utils/evaluate-step-filters.util';

@Injectable()
export class FilterWorkflowAction implements WorkflowAction {
  constructor(
    private readonly roboostRecordVisibilityService: RoboostRecordVisibilityService,
  ) {}

  async execute(input: WorkflowActionInput): Promise<WorkflowActionOutput> {
    const { currentStepId, steps, context, runInfo } = input;

    const step = findStepOrThrow({
      stepId: currentStepId,
      steps,
    });

    if (!isWorkflowFilterAction(step)) {
      throw new WorkflowStepExecutorException(
        'Step is not a filter action',
        WorkflowStepExecutorExceptionCode.INVALID_STEP_TYPE,
      );
    }

    const { stepFilterGroups, stepFilters } = step.settings.input;

    if (!stepFilterGroups || !stepFilters) {
      return {
        result: {
          shouldEndWorkflowRun: false,
        },
      };
    }

    const matchesFilter = evaluateStepFilters({
      stepFilters,
      stepFilterGroups,
      context,
      teamMemberIdsByTeamId:
        await this.roboostRecordVisibilityService.getTeamMemberIdsByTeamId(
          runInfo.workspaceId,
        ),
    });

    return {
      result: {
        matchesFilter,
      },
      shouldEndWorkflowRun: !matchesFilter,
    };
  }
}
