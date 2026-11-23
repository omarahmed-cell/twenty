import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import {
  MeetingGooglePushJob,
  type MeetingGooglePushJobData,
} from 'src/modules/meeting/scheduling/jobs/meeting-google-push.job';

type RecordEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>> & {
    properties: { updatedFields?: string[] };
  }
>;

const GOOGLE_FIELDS = [
  'title',
  'startsAt',
  'endsAt',
  'timezone',
  'locationType',
  'location',
  'attendeeDescription',
];

// Calendar sync and scheduling write with SQL and emit no events, so only CRM edits reach Google
@Injectable()
export class MeetingGooglePushListener {
  constructor(
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('meeting', DatabaseEventAction.UPDATED)
  async handleMeetingUpdated(batch: RecordEventBatch) {
    await this.enqueue(
      batch.workspaceId,
      batch.events
        .filter((event) =>
          (event.properties?.updatedFields ?? []).some((field) =>
            GOOGLE_FIELDS.includes(field),
          ),
        )
        .map((event) => event.recordId),
    );
  }

  @OnDatabaseBatchEvent('meetingAttendee', DatabaseEventAction.CREATED)
  async handleAttendeeCreated(batch: RecordEventBatch) {
    await this.enqueueAttendeeMeetings(batch);
  }

  @OnDatabaseBatchEvent('meetingAttendee', DatabaseEventAction.UPDATED)
  async handleAttendeeUpdated(batch: RecordEventBatch) {
    await this.enqueueAttendeeMeetings({
      ...batch,
      events: batch.events.filter((event) =>
        (event.properties?.updatedFields ?? []).includes('email'),
      ),
    });
  }

  @OnDatabaseBatchEvent('meetingAttendee', DatabaseEventAction.DELETED)
  async handleAttendeeDeleted(batch: RecordEventBatch) {
    await this.enqueueAttendeeMeetings(batch);
  }

  private async enqueueAttendeeMeetings(batch: RecordEventBatch) {
    await this.enqueue(
      batch.workspaceId,
      batch.events.map(
        (event) =>
          (event.properties?.after?.meetingId ??
            event.properties?.before?.meetingId) as string | undefined,
      ),
    );
  }

  private async enqueue(
    workspaceId: string,
    meetingIds: (string | undefined | null)[],
  ) {
    const uniqueIds = [...new Set(meetingIds.filter(isDefined))];

    if (uniqueIds.length === 0) {
      return;
    }

    await this.messageQueueService.add<MeetingGooglePushJobData>(
      MeetingGooglePushJob.name,
      { workspaceId, meetingIds: uniqueIds },
    );
  }
}
