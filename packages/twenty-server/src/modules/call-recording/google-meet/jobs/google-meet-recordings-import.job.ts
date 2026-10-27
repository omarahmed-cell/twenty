import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { GoogleMeetRecordingsImportService } from 'src/modules/call-recording/google-meet/services/google-meet-recordings-import.service';

export type GoogleMeetRecordingsImportJobData = {
  workspaceId: string;
  connectedAccountId: string;
  lookbackDays: number;
};

@Processor({ queueName: MessageQueue.calendarQueue, scope: Scope.REQUEST })
export class GoogleMeetRecordingsImportJob {
  constructor(
    private readonly googleMeetRecordingsImportService: GoogleMeetRecordingsImportService,
  ) {}

  @Process(GoogleMeetRecordingsImportJob.name)
  async handle(data: GoogleMeetRecordingsImportJobData): Promise<void> {
    await this.googleMeetRecordingsImportService.importForConnectedAccount(
      data,
    );
  }
}
