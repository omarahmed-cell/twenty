import { Injectable } from '@nestjs/common';

import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  CompanyCalculatedFieldsJob,
  type CompanyCalculatedFieldsJobData,
} from 'src/modules/company-calculated-fields/jobs/company-calculated-fields.job';

const LIVE_DELAY_MILLISECONDS = 2_000;
// Imports write in many small batches; waiting lets one recompute cover them
const IMPORT_DELAY_MILLISECONDS = 60_000;
const PENDING_REFERENCES_TTL_MILLISECONDS = 24 * 60 * 60 * 1_000;

@Injectable()
export class CompanyCalculationQueueService {
  constructor(
    @InjectCacheStorage(CacheStorageNamespace.EngineWorkspace)
    private readonly cacheStorage: CacheStorageService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async enqueueReferences({
    workspaceId,
    references,
    isImport = false,
  }: {
    workspaceId: string;
    references: string[];
    isImport?: boolean;
  }): Promise<void> {
    if (references.length === 0) {
      return;
    }

    await this.cacheStorage.setAdd(
      this.getPendingReferencesKey(workspaceId),
      [...new Set(references)],
      PENDING_REFERENCES_TTL_MILLISECONDS,
    );

    await this.scheduleJob({ workspaceId, isImport });
  }

  async scheduleJob({
    workspaceId,
    isImport = false,
  }: {
    workspaceId: string;
    isImport?: boolean;
  }): Promise<void> {
    // One waiting job per workspace drains every reference added before it runs
    await this.messageQueueService.add<CompanyCalculatedFieldsJobData>(
      CompanyCalculatedFieldsJob.name,
      { workspaceId },
      {
        delay: isImport ? IMPORT_DELAY_MILLISECONDS : LIVE_DELAY_MILLISECONDS,
        deduplication: {
          id: `company-calculated-fields-${workspaceId}`,
          keepLastIfActive: true,
        },
      },
    );
  }

  async popReferences(workspaceId: string): Promise<string[]> {
    const key = this.getPendingReferencesKey(workspaceId);
    const pendingCount = await this.cacheStorage.getSetLength(key);

    if (pendingCount === 0) {
      return [];
    }

    return (await this.cacheStorage.setPop(key, pendingCount)) as string[];
  }

  private getPendingReferencesKey(workspaceId: string) {
    return `company-calculated-fields:pending:${workspaceId}`;
  }
}
