import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MEETING_FIELDS_JOB_NAME } from 'src/modules/meeting-fields/constants/meeting-fields-job-name.constant';
import {
  type MeetingSourceAssignment,
  MeetingFieldsService,
} from 'src/modules/meeting-fields/services/meeting-fields.service';

export type MeetingFieldsJobData = {
  workspaceId: string;
  meetingSources: MeetingSourceAssignment[];
  transcriptRecordIds: string[];
};

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class MeetingFieldsJob {
  constructor(private readonly meetingFieldsService: MeetingFieldsService) {}

  @Process(MEETING_FIELDS_JOB_NAME)
  async handle({
    workspaceId,
    meetingSources,
    transcriptRecordIds,
  }: MeetingFieldsJobData): Promise<void> {
    await this.meetingFieldsService.assignMeetingSources({
      workspaceId,
      assignments: meetingSources,
    });

    if (transcriptRecordIds.length > 0) {
      await this.meetingFieldsService.refreshHasMeetingTranscript({
        workspaceId,
        recordIds: transcriptRecordIds,
      });
    }
  }
}
