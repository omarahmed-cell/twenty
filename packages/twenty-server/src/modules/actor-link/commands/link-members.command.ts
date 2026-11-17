import { readFile } from 'node:fs/promises';

import { isNonEmptyArray } from 'twenty-shared/utils';
import { Command, Option } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import {
  type RunOnWorkspaceArgs,
  type WorkspaceCommandOptions,
} from 'src/database/commands/command-runners/workspace.command-runner';
import {
  ActorLinkService,
  type ActorLinkReport,
} from 'src/modules/actor-link/services/actor-link.service';
import {
  parseHubspotOwnerMap,
  parsePendingMemberLinks,
} from 'src/modules/actor-link/utils/parse-actor-link-inputs.util';

type LinkMembersCommandOptions = WorkspaceCommandOptions & {
  ownerMap?: string;
  links?: string;
  matchNames?: boolean;
};

const readJsonFile = async (path: string): Promise<unknown> =>
  JSON.parse(await readFile(path, 'utf8'));

@Command({
  name: 'actor:link-members',
  description:
    'Link HubSpot-migrated records to workspace members added after the load: fills createdBy and workspace member relations that are still empty, never replacing a link. Safe to re-run.',
})
export class LinkMembersCommand extends ProvisionedWorkspaceCommandRunner<LinkMembersCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly actorLinkService: ActorLinkService,
  ) {
    super(workspaceIteratorService);
  }

  @Option({
    flags: '--owner-map <path>',
    description:
      'JSON object keyed by HubSpot owner id: {name, email, active, workspaceMemberId}',
    required: true,
  })
  parseOwnerMap(value: string): string {
    return value;
  }

  @Option({
    flags: '--links <path>',
    description:
      'JSON array of pending links written by the loader: {object, recordId, field, hubspotOwnerId}',
    required: false,
  })
  parseLinks(value: string): string {
    return value;
  }

  @Option({
    flags: '--match-names',
    description:
      'Also link createdBy on every object where the actor name equals a unique owner name',
    required: false,
  })
  parseMatchNames(): boolean {
    return true;
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<LinkMembersCommandOptions>): Promise<void> {
    if (!options.ownerMap) {
      throw new Error('--owner-map is required');
    }

    const ownerMap = parseHubspotOwnerMap(await readJsonFile(options.ownerMap));
    const links = options.links
      ? parsePendingMemberLinks(await readJsonFile(options.links))
      : [];
    const isDryRun = options.dryRun ?? false;

    const report = await this.actorLinkService.linkMembers({
      workspaceId,
      ownerMap,
      links,
      shouldMatchNames: options.matchNames ?? false,
      isDryRun,
    });

    this.logReport({ workspaceId, ownerMap, report, isDryRun });
  }

  private logReport({
    workspaceId,
    ownerMap,
    report,
    isDryRun,
  }: {
    workspaceId: string;
    ownerMap: ReturnType<typeof parseHubspotOwnerMap>;
    report: ActorLinkReport;
    isDryRun: boolean;
  }): void {
    const prefix = `${isDryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}:`;
    const filledLabel = isDryRun ? 'would fill' : 'filled';

    for (const [ownerId, resolution] of Object.entries(
      report.ownerResolutionByOwnerId,
    )) {
      if (!resolution.isResolved) {
        this.logger.warn(
          `${prefix} owner ${ownerId} (${ownerMap[ownerId]?.name}) unresolved: ${resolution.reason}`,
        );
      }
    }

    for (const skippedGroup of report.skippedGroups) {
      this.logger.warn(
        `${prefix} skipped ${skippedGroup.linkCount} link(s) on ${skippedGroup.objectName}.${skippedGroup.fieldName}: ${skippedGroup.reason}`,
      );
    }

    for (const row of report.pendingLinkRows) {
      this.logger.log(
        `${prefix} ${row.objectName}.${row.fieldName}: ${filledLabel} ${row.filledCount}, already linked ${row.alreadyLinkedCount}, unresolved owner ${row.unresolvedOwnerCount}, missing record ${row.missingRecordCount}, deleted record ${row.deletedRecordCount}`,
      );
    }

    if (isNonEmptyArray(report.duplicateOwnerNames)) {
      this.logger.warn(
        `${prefix} name matching skipped duplicate owner names: ${report.duplicateOwnerNames.join(', ')}`,
      );
    }

    if (isNonEmptyArray(report.unresolvedOwnerNames)) {
      this.logger.warn(
        `${prefix} name matching skipped unresolved owners: ${report.unresolvedOwnerNames.join(', ')}`,
      );
    }

    for (const row of report.nameMatchRows) {
      this.logger.log(
        `${prefix} ${row.objectName}.createdBy by name: ${filledLabel} ${row.filledCount}`,
      );
    }
  }
}
