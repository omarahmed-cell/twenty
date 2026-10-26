import { Command, Option } from 'nest-commander';
import { STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import {
  ProvisionedWorkspaceCommandRunner,
  type ProvisionedWorkspaceCommandOptions,
} from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { type FromToAllUniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';

type MoveLineOfItemTabCommandOptions = ProvisionedWorkspaceCommandOptions & {
  rollback?: boolean;
};

const LINE_OF_ITEM_TAB_UNIVERSAL_IDENTIFIER =
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
    .lineItems.universalIdentifier;

// Position provision-catalog-objects gave the tab (right after Home)
const PREVIOUS_POSITION = 15;
// Between Files (50) and Emails (60)
const NEW_POSITION = 55;

// A tab the user already moved elsewhere is left where it is
@RegisteredWorkspaceCommand('2.49.0', 1792968069375)
@Command({
  name: 'upgrade:2-49:move-line-of-item-tab',
  description:
    'Move the Deal "Line of Item" tab from after Home to between Files and Emails, unless it was moved by hand. Pass --rollback to move it back.',
})
export class MoveLineOfItemTabCommand extends ProvisionedWorkspaceCommandRunner<MoveLineOfItemTabCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  @Option({
    flags: '--rollback',
    description: 'Move the tab back after Home',
    required: false,
  })
  parseRollback(): boolean {
    return true;
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<MoveLineOfItemTabCommandOptions>): Promise<void> {
    const isRollback = options.rollback === true;
    const fromPosition = isRollback ? NEW_POSITION : PREVIOUS_POSITION;
    const toPosition = isRollback ? PREVIOUS_POSITION : NEW_POSITION;
    const dryRun = options.dryRun ?? false;

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const existing = structuredClone(
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatPageLayoutTabMaps',
        'featureFlagsMap',
      ]),
    );

    const lineOfItemTab =
      existing.flatPageLayoutTabMaps.byUniversalIdentifier[
        LINE_OF_ITEM_TAB_UNIVERSAL_IDENTIFIER
      ];

    if (!isDefined(lineOfItemTab) || lineOfItemTab.position !== fromPosition) {
      return;
    }

    const { idByUniversalIdentifierByMetadataName } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: new Date().toISOString(),
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo(
        {
          workspaceId,
          dryRun,
          buildOptions: {
            isSystemBuild: true,
            inferDeletionFromMissingEntities: {},
            applicationUniversalIdentifier:
              twentyStandardFlatApplication.universalIdentifier,
          },
          additionalCacheDataMaps: {
            featureFlagsMap: existing.featureFlagsMap,
          },
          idByUniversalIdentifierByMetadataName,
          fromToAllFlatEntityMaps: {
            flatPageLayoutTabMaps: {
              from: existing.flatPageLayoutTabMaps,
              to: {
                ...existing.flatPageLayoutTabMaps,
                byUniversalIdentifier: {
                  ...existing.flatPageLayoutTabMaps.byUniversalIdentifier,
                  [LINE_OF_ITEM_TAB_UNIVERSAL_IDENTIFIER]: {
                    ...lineOfItemTab,
                    position: toPosition,
                  },
                },
              },
            },
          } as FromToAllUniversalFlatEntityMaps,
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Moving the Line of Item tab failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: moved the Line of Item tab from position ${fromPosition} to ${toPosition}`,
    );
  }
}
