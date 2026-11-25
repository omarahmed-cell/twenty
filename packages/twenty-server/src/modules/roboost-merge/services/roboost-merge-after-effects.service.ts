import { Injectable, Logger } from '@nestjs/common';

import { type RoboostMergeObjectName } from 'twenty-shared/constants';
import { type SegmentTargetObject } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { CompanyCalculationQueueService } from 'src/modules/company-calculated-fields/services/company-calculation-queue.service';
import { OpportunityCalculationQueueService } from 'src/modules/opportunity-calculated-fields/services/opportunity-calculation-queue.service';
import { PersonCalculationQueueService } from 'src/modules/person-calculated-fields/services/person-calculation-queue.service';
import { type RoboostMergeMovedLink } from 'src/modules/roboost-merge/types/roboost-merge.type';
import {
  RoboostScoreRecordsJob,
  type RoboostScoreRecordsJobData,
} from 'src/modules/roboost-scoring/jobs/roboost-score-records.job';
import { SegmentMembershipSyncService } from 'src/modules/segment/services/segment-membership-sync.service';

const SEGMENT_TARGET_BY_OBJECT: Partial<
  Record<RoboostMergeObjectName, SegmentTargetObject>
> = {
  company: 'COMPANY' as SegmentTargetObject,
  person: 'PERSON' as SegmentTargetObject,
  opportunity: 'OPPORTUNITY' as SegmentTargetObject,
};

// Merges write with plain SQL (no record events, so no Assign notifications); these are the follow-ups events would have triggered
@Injectable()
export class RoboostMergeAfterEffectsService {
  private readonly logger = new Logger(RoboostMergeAfterEffectsService.name);

  constructor(
    private readonly segmentMembershipSyncService: SegmentMembershipSyncService,
    private readonly companyCalculationQueueService: CompanyCalculationQueueService,
    private readonly personCalculationQueueService: PersonCalculationQueueService,
    private readonly opportunityCalculationQueueService: OpportunityCalculationQueueService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async afterRecordsChanged({
    workspaceId,
    objectName,
    recordIds,
    movedLinks,
    relatedCompanyIds,
  }: {
    workspaceId: string;
    objectName: RoboostMergeObjectName;
    recordIds: string[];
    movedLinks: RoboostMergeMovedLink[];
    relatedCompanyIds: string[];
  }) {
    const segmentTarget = SEGMENT_TARGET_BY_OBJECT[objectName];
    const touchedSegments = movedLinks.some(
      (link) => link.tableName === 'segmentMember',
    );

    try {
      if (isDefined(segmentTarget) && touchedSegments) {
        await this.segmentMembershipSyncService.syncRecordMemberships({
          workspaceId,
          targetObject: segmentTarget,
          recordIds,
        });
        await this.segmentMembershipSyncService.syncAllMemberCounts({
          workspaceId,
          targetObject: segmentTarget,
        });
      }

      const companyIds = [
        ...relatedCompanyIds,
        ...(objectName === 'company' ? recordIds : []),
      ];

      await this.companyCalculationQueueService.enqueueReferences({
        workspaceId,
        references: companyIds,
      });

      if (objectName === 'person') {
        await this.personCalculationQueueService.enqueueReferences({
          workspaceId,
          references: recordIds,
        });
      }

      if (objectName === 'opportunity') {
        await this.opportunityCalculationQueueService.enqueueReferences({
          workspaceId,
          references: recordIds,
        });
      }

      if (objectName !== 'service') {
        await this.messageQueueService.add<RoboostScoreRecordsJobData>(
          RoboostScoreRecordsJob.name,
          { workspaceId, objectName, recordIds },
        );
      }
    } catch (error) {
      this.logger.error(
        `Workspace ${workspaceId}: follow-ups after a merge failed: ${(error as Error).message}`,
      );
    }
  }
}
