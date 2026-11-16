import { Command } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { MeetingFieldsService } from 'src/modules/meeting-fields/services/meeting-fields.service';

@Command({
  name: 'calendar-event:backfill-meeting-fields',
  description:
    'Set Meeting source on meetings that have none (from the calendar sync or createdBy.source) and recompute Meeting transcript available. Run it after the loader writes Transcript in HubSpot.',
})
export class BackfillMeetingFieldsCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly meetingFieldsService: MeetingFieldsService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would backfill meeting fields`,
      );

      return;
    }

    const sourceCount =
      await this.meetingFieldsService.backfillMeetingSources(workspaceId);
    const transcriptCount =
      await this.meetingFieldsService.refreshHasMeetingTranscript({
        workspaceId,
      });

    this.logger.log(
      `Workspace ${workspaceId}: meeting source set on ${sourceCount} meetings, transcript available updated on ${transcriptCount}`,
    );
  }
}
