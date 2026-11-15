import { Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { DataSource, Repository } from 'typeorm';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { CompanyCalculationQueueService } from 'src/modules/company-calculated-fields/services/company-calculation-queue.service';
import { PersonCalculationQueueService } from 'src/modules/person-calculated-fields/services/person-calculation-queue.service';

export const COMPANY_PAST_MEETINGS_CRON_PATTERN = '*/15 * * * *';

// The window overlaps the cron interval so a slow run never skips a meeting
const LOOKBACK_MINUTES = 20;

// A meeting only counts as activity once it has started, which no record write signals
@Processor(MessageQueue.cronQueue)
export class CompanyPastMeetingsCronJob {
  private readonly logger = new Logger(CompanyPastMeetingsCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly companyCalculationQueueService: CompanyCalculationQueueService,
    private readonly personCalculationQueueService: PersonCalculationQueueService,
  ) {}

  @Process(CompanyPastMeetingsCronJob.name)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        const meetings: { id: string }[] = await this.coreDataSource.query(
          `SELECT "id" FROM "${getWorkspaceSchemaName(workspaceId)}"."calendarEvent"
          WHERE "deletedAt" IS NULL
            AND "startsAt" <= now()
            AND "startsAt" > now() - interval '${LOOKBACK_MINUTES} minutes'`,
        );

        const references = meetings.map(({ id }) => `calendarEvent:${id}`);

        await this.companyCalculationQueueService.enqueueReferences({
          workspaceId,
          references,
        });
        await this.personCalculationQueueService.enqueueReferences({
          workspaceId,
          references,
        });
      } catch (error) {
        this.logger.error(
          `Could not check started meetings for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }
}
