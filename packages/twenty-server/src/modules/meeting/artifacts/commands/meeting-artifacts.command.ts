import { Command } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { MeetingArtifactsService } from 'src/modules/meeting/artifacts/services/meeting-artifacts.service';

@Command({
  name: 'meeting:artifacts',
  description:
    'Read Google Meet recordings, transcripts and Gemini notes now (the cron does this every 15 minutes) and print counts only.',
})
export class MeetingArtifactsCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly meetingArtifactsService: MeetingArtifactsService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
  }: RunOnWorkspaceArgs): Promise<void> {
    const summary =
      await this.meetingArtifactsService.syncWorkspace(workspaceId);

    this.logger.log(`RESULT ${JSON.stringify(summary)}`);
  }
}
