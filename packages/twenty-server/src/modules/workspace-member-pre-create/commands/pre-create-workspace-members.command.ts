import { readFile } from 'node:fs/promises';

import { Command, Option } from 'nest-commander';
import { isNonEmptyString } from '@sniptt/guards';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import {
  type RunOnWorkspaceArgs,
  type WorkspaceCommandOptions,
} from 'src/database/commands/command-runners/workspace.command-runner';
import { WorkspaceMemberAccessService } from 'src/engine/core-modules/user-workspace/services/workspace-member-access.service';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WORKSPACE_MEMBER_STATUS } from 'src/modules/workspace-member/constants/workspace-member-status.constant';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';
import { parseCsvRows } from 'src/modules/workspace-member-pre-create/utils/parse-csv.util';
import { planWorkspaceMemberPreCreation } from 'src/modules/workspace-member-pre-create/utils/plan-workspace-member-pre-creation.util';

type PreCreateWorkspaceMembersCommandOptions = WorkspaceCommandOptions & {
  csv?: string;
};

@Command({
  name: 'workspace-member:pre-create',
  description:
    'Pre-create workspace members from a CSV (columns: name, email, and twenty_status or status with Active, Deactivated or Skip). Members whose email is already in the workspace are left untouched, so it is safe to re-run.',
})
export class PreCreateWorkspaceMembersCommand extends ProvisionedWorkspaceCommandRunner<PreCreateWorkspaceMembersCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly workspaceMemberAccessService: WorkspaceMemberAccessService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
  ) {
    super(workspaceIteratorService);
  }

  @Option({
    flags: '--csv <path>',
    description: 'Path to the CSV of members to pre-create',
    required: true,
  })
  parseCsv(value: string): string {
    return value;
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<PreCreateWorkspaceMembersCommandOptions>): Promise<void> {
    if (!isNonEmptyString(options.csv)) {
      throw new Error('--csv is required');
    }

    const isDryRun = options.dryRun ?? false;
    const prefix = `${isDryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}:`;

    const rows = parseCsvRows(await readFile(options.csv, 'utf8'));

    const workspaceMembers =
      await this.workspaceOrmManager.executeInWorkspaceContext(
        () =>
          this.workspaceOrmManager
            .getRepository<WorkspaceMemberWorkspaceEntity>('workspaceMember', {
              shouldBypassPermissionChecks: true,
            })
            .find({ withDeleted: true }),
        buildSystemAuthContext(workspaceId),
      );

    const plan = planWorkspaceMemberPreCreation({
      rows,
      existingWorkspaceMemberEmails: new Set(
        workspaceMembers
          .map(({ userEmail }) => userEmail)
          .filter(isNonEmptyString),
      ),
    });

    for (const email of plan.existingEmails) {
      this.logger.log(`${prefix} existing ${email}`);
    }

    for (const email of plan.statusConflictEmails) {
      this.logger.warn(
        `${prefix} rows for ${email} disagree on status, using Active`,
      );
    }

    for (const { email, status } of plan.invalidStatusRows) {
      this.logger.warn(
        `${prefix} skipped ${email}: unknown status "${status}"`,
      );
    }

    let createdActiveCount = 0;
    let createdDeactivatedCount = 0;
    let failedCount = 0;

    for (const plannedMember of plan.toCreate) {
      if (!isDryRun) {
        try {
          await this.workspaceMemberAccessService.preCreateWorkspaceMember({
            workspaceId,
            ...plannedMember,
          });
        } catch (error) {
          failedCount++;
          this.logger.error(
            `${prefix} could not pre-create ${plannedMember.email}: ${error instanceof Error ? error.message : String(error)}`,
          );
          continue;
        }
      }

      this.logger.log(
        `${prefix} ${isDryRun ? 'would create' : 'created'} ${plannedMember.memberStatus} ${plannedMember.email}`,
      );

      if (plannedMember.memberStatus === WORKSPACE_MEMBER_STATUS.ACTIVE) {
        createdActiveCount++;
      } else {
        createdDeactivatedCount++;
      }
    }

    const createdLabel = isDryRun ? 'would create' : 'created';

    this.logger.log(
      `${prefix} ${createdLabel} Active ${createdActiveCount}, ${createdLabel} Deactivated ${createdDeactivatedCount}, existing ${plan.existingEmails.length}, skipped ${plan.skippedRowCount}${failedCount > 0 ? `, failed ${failedCount}` : ''}`,
    );
  }
}
