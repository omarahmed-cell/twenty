import { type ActorMetadata, FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type WorkflowExecutionContext } from 'src/modules/workflow/workflow-executor/types/workflow-execution-context.type';

// The workflow ids let field history name and link the workflow that made the change
export const buildWorkflowActorMetadata = (
  executionContext: WorkflowExecutionContext,
): ActorMetadata => {
  const workflowContext = isDefined(executionContext.workflowRun)
    ? {
        workflowRunId: executionContext.workflowRun.id,
        ...(isDefined(executionContext.workflowRun.workflowId) && {
          workflowId: executionContext.workflowRun.workflowId,
        }),
      }
    : {};

  if (executionContext.isActingOnBehalfOfUser) {
    return {
      ...executionContext.initiator,
      context: { ...executionContext.initiator.context, ...workflowContext },
    };
  }

  return {
    source: FieldActorSource.WORKFLOW,
    name: 'Workflow',
    workspaceMemberId: null,
    context: workflowContext,
  };
};
