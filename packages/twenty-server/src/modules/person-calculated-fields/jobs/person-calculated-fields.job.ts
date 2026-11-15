import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { PERSON_CALCULATED_FIELDS_JOB_NAME } from 'src/modules/person-calculated-fields/constants/person-calculated-fields-job-name.constant';
import { PersonCalculatedFieldsService } from 'src/modules/person-calculated-fields/services/person-calculated-fields.service';
import { PersonCalculationQueueService } from 'src/modules/person-calculated-fields/services/person-calculation-queue.service';

export type PersonCalculatedFieldsJobData = {
  workspaceId: string;
  isFullRecompute?: boolean;
};

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class PersonCalculatedFieldsJob {
  constructor(
    private readonly personCalculatedFieldsService: PersonCalculatedFieldsService,
    private readonly personCalculationQueueService: PersonCalculationQueueService,
  ) {}

  @Process(PERSON_CALCULATED_FIELDS_JOB_NAME)
  async handle({
    workspaceId,
    isFullRecompute = false,
  }: PersonCalculatedFieldsJobData): Promise<void> {
    if (isFullRecompute) {
      await this.personCalculatedFieldsService.recomputeAllPeople(workspaceId);

      return;
    }

    const references =
      await this.personCalculationQueueService.popReferences(workspaceId);

    if (references.length === 0) {
      return;
    }

    const personIds = await this.personCalculatedFieldsService.resolvePersonIds(
      { workspaceId, references },
    );

    await this.personCalculatedFieldsService.recomputePeople({
      workspaceId,
      personIds,
    });
  }
}
