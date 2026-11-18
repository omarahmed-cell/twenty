import { Command, Option } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner, type ProvisionedWorkspaceCommandOptions } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import {
  buildSeededStandardAdditionsFromTo,
  buildSeededStandardRollbackFromTo,
  countSeededStandardAdditions,
} from 'src/database/commands/upgrade-version-command/2-49/utils/build-seeded-standard-additions-from-to.util';
import { ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS } from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { EMAIL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS } from 'src/modules/unified-email/constants/email-timeline-activity-type-universal-identifiers.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

type ProvisionEmailReplySyncCommandOptions =
  ProvisionedWorkspaceCommandOptions & {
    rollback?: boolean;
  };

const SEED_UNIVERSAL_IDENTIFIERS = [
  EMAIL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS.emailReplied,
];

@RegisteredWorkspaceCommand('2.49.0', 1795044442993)
@Command({
  name: 'upgrade:2-49:provision-email-reply-sync',
  description:
    'Add the "email reply" timeline type written by Gmail reply sync. Pass --rollback to remove it.',
})
export class ProvisionEmailReplySyncCommand extends ProvisionedWorkspaceCommandRunner<ProvisionEmailReplySyncCommandOptions> {
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
    description: 'Undo what this command did',
    required: false,
  })
  parseRollback(): boolean {
    return true;
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<ProvisionEmailReplySyncCommandOptions>): Promise<void> {
    const dryRun = options.dryRun ?? false;
    const isRollback = options.rollback === true;

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const existing = structuredClone(
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        ...ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS,
        'featureFlagsMap',
      ]),
    );
    const {
      allFlatEntityMaps: standard,
      idByUniversalIdentifierByMetadataName,
    } = computeTwentyStandardApplicationAllFlatEntityMaps({
      now: new Date().toISOString(),
      workspaceId,
      twentyStandardApplicationId: twentyStandardFlatApplication.id,
    });

    const provision = buildSeededStandardAdditionsFromTo({
      existing,
      standard,
      seedUniversalIdentifiers: SEED_UNIVERSAL_IDENTIFIERS,
    });
    const additionCount = countSeededStandardAdditions(provision.additions);

    if (!isRollback && (dryRun || additionCount === 0)) {
      this.logger.log(
        `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${additionCount} email reply sync standard addition(s)`,
      );

      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo(
        {
          workspaceId,
          dryRun,
          buildOptions: {
            isSystemBuild: true,
            inferDeletionFromMissingEntities: isRollback ? true : {},
            applicationUniversalIdentifier:
              twentyStandardFlatApplication.universalIdentifier,
          },
          additionalCacheDataMaps: {
            featureFlagsMap: existing.featureFlagsMap,
          },
          idByUniversalIdentifierByMetadataName,
          fromToAllFlatEntityMaps: isRollback
            ? buildSeededStandardRollbackFromTo({
                existing,
                standard,
                seedUniversalIdentifiers: SEED_UNIVERSAL_IDENTIFIERS,
              })
            : provision.fromToAllFlatEntityMaps,
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Email reply sync ${isRollback ? 'rollback' : 'provisioning'} failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `Workspace ${workspaceId}: ${isRollback ? 'email reply sync rolled back' : `${additionCount} email reply sync standard addition(s)`}`,
    );
  }
}
