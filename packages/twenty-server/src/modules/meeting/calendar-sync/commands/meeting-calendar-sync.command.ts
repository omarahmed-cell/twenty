import { Command } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { MeetingCalendarSyncService } from 'src/modules/meeting/calendar-sync/services/meeting-calendar-sync.service';

@Command({
  name: 'meeting:calendar-sync',
  description:
    'Sync Google Calendar events into Meetings now (the cron does this every 5 minutes) and print what happened.',
})
export class MeetingCalendarSyncCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly meetingCalendarSyncService: MeetingCalendarSyncService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
  }: RunOnWorkspaceArgs): Promise<void> {
    const summary =
      await this.meetingCalendarSyncService.syncWorkspace(workspaceId);

    this.logger.log(`RESULT ${JSON.stringify(summary)}`);
  }
}
