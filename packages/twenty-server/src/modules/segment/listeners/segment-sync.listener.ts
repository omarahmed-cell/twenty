import { Injectable } from '@nestjs/common';

import {
  type ObjectRecordCreateEvent,
  type ObjectRecordDeleteEvent,
  type ObjectRecordDestroyEvent,
  type ObjectRecordRestoreEvent,
  type ObjectRecordUpdateEvent,
} from 'twenty-shared/database-events';
import { type SegmentTargetObject } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import {
  SegmentSyncJob,
  type SegmentSyncJobData,
} from 'src/modules/segment/jobs/segment-sync.job';
import { type SegmentMemberWorkspaceEntity } from 'src/modules/segment/standard-objects/segment-member.workspace-entity';
import { type SegmentWorkspaceEntity } from 'src/modules/segment/standard-objects/segment.workspace-entity';

type SegmentMemberEventBatch = WorkspaceEventBatch<
  | ObjectRecordCreateEvent<SegmentMemberWorkspaceEntity>
  | ObjectRecordDeleteEvent<SegmentMemberWorkspaceEntity>
  | ObjectRecordRestoreEvent<SegmentMemberWorkspaceEntity>
  | ObjectRecordDestroyEvent<SegmentMemberWorkspaceEntity>
>;

const getEventRecord = (
  event: SegmentMemberEventBatch['events'][number],
): SegmentMemberWorkspaceEntity | undefined =>
  'after' in event.properties && isDefined(event.properties.after)
    ? event.properties.after
    : 'before' in event.properties
      ? event.properties.before
      : undefined;

@Injectable()
export class SegmentSyncListener {
  constructor(
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('segment', DatabaseEventAction.CREATED)
  async handleSegmentCreated(
    payload: WorkspaceEventBatch<
      ObjectRecordCreateEvent<SegmentWorkspaceEntity>
    >,
  ) {
    await this.enqueue({
      workspaceId: payload.workspaceId,
      type: 'SYNC_OPTIONS',
    });
  }

  @OnDatabaseBatchEvent('segment', DatabaseEventAction.UPDATED)
  async handleSegmentUpdated(
    payload: WorkspaceEventBatch<
      ObjectRecordUpdateEvent<SegmentWorkspaceEntity>
    >,
  ) {
    const hasOptionChange = payload.events.some(
      ({ properties: { before, after } }) =>
        before.name !== after.name ||
        before.targetObject !== after.targetObject,
    );

    if (hasOptionChange) {
      await this.enqueue({
        workspaceId: payload.workspaceId,
        type: 'SYNC_OPTIONS',
      });
    }
  }

  @OnDatabaseBatchEvent('segment', DatabaseEventAction.DELETED)
  async handleSegmentDeleted(
    payload: WorkspaceEventBatch<
      ObjectRecordDeleteEvent<SegmentWorkspaceEntity>
    >,
  ) {
    await this.enqueue({
      workspaceId: payload.workspaceId,
      type: 'SEGMENTS_DELETED',
      segmentIds: payload.events.map(({ recordId }) => recordId),
    });
  }

  @OnDatabaseBatchEvent('segment', DatabaseEventAction.RESTORED)
  async handleSegmentRestored(
    payload: WorkspaceEventBatch<
      ObjectRecordRestoreEvent<SegmentWorkspaceEntity>
    >,
  ) {
    await this.enqueue({
      workspaceId: payload.workspaceId,
      type: 'SEGMENTS_RESTORED',
      segments: payload.events
        .filter(({ properties }) => isDefined(properties.before.deletedAt))
        .map(({ recordId, properties }) => ({
          id: recordId,
          deletedAt: properties.before.deletedAt as string,
        })),
    });
  }

  @OnDatabaseBatchEvent('segment', DatabaseEventAction.DESTROYED)
  async handleSegmentDestroyed(
    payload: WorkspaceEventBatch<
      ObjectRecordDestroyEvent<SegmentWorkspaceEntity>
    >,
  ) {
    await this.enqueue({
      workspaceId: payload.workspaceId,
      type: 'SYNC_OPTIONS',
    });
  }

  @OnDatabaseBatchEvent('segmentMember', DatabaseEventAction.CREATED)
  async handleMemberCreated(payload: SegmentMemberEventBatch) {
    await this.enqueueMemberSync(payload);
  }

  @OnDatabaseBatchEvent('segmentMember', DatabaseEventAction.DELETED)
  async handleMemberDeleted(payload: SegmentMemberEventBatch) {
    await this.enqueueMemberSync(payload);
  }

  @OnDatabaseBatchEvent('segmentMember', DatabaseEventAction.RESTORED)
  async handleMemberRestored(payload: SegmentMemberEventBatch) {
    await this.enqueueMemberSync(payload);
  }

  @OnDatabaseBatchEvent('segmentMember', DatabaseEventAction.DESTROYED)
  async handleMemberDestroyed(payload: SegmentMemberEventBatch) {
    await this.enqueueMemberSync(payload);
  }

  @OnDatabaseBatchEvent('company', DatabaseEventAction.DESTROYED)
  async handleCompanyDestroyed(payload: WorkspaceEventBatch<unknown>) {
    await this.enqueueTargetsDestroyed(payload.workspaceId, 'COMPANY');
  }

  @OnDatabaseBatchEvent('person', DatabaseEventAction.DESTROYED)
  async handlePersonDestroyed(payload: WorkspaceEventBatch<unknown>) {
    await this.enqueueTargetsDestroyed(payload.workspaceId, 'PERSON');
  }

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.DESTROYED)
  async handleOpportunityDestroyed(payload: WorkspaceEventBatch<unknown>) {
    await this.enqueueTargetsDestroyed(payload.workspaceId, 'OPPORTUNITY');
  }

  private async enqueueMemberSync(payload: SegmentMemberEventBatch) {
    const members = payload.events.map(getEventRecord).filter(isDefined);

    if (members.length === 0) {
      return;
    }

    const collect = (recordIds: (string | null)[]) => [
      ...new Set(recordIds.filter(isDefined)),
    ];

    await this.enqueue({
      workspaceId: payload.workspaceId,
      type: 'SYNC_MEMBERS',
      segmentIds: collect(members.map(({ segmentId }) => segmentId)),
      recordIdsByTargetObject: {
        COMPANY: collect(members.map(({ targetCompanyId }) => targetCompanyId)),
        PERSON: collect(members.map(({ targetPersonId }) => targetPersonId)),
        OPPORTUNITY: collect(
          members.map(({ targetOpportunityId }) => targetOpportunityId),
        ),
      },
    });
  }

  private async enqueueTargetsDestroyed(
    workspaceId: string,
    targetObject: SegmentTargetObject,
  ) {
    await this.enqueue({
      workspaceId,
      type: 'TARGETS_DESTROYED',
      targetObject,
    });
  }

  private async enqueue(data: SegmentSyncJobData) {
    await this.messageQueueService.add<SegmentSyncJobData>(
      SegmentSyncJob.name,
      data,
    );
  }
}
