import { Command, Option } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';
import { type DataSource } from 'typeorm';

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
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

type ProvisionEmailRecordPageFieldsCommandOptions =
  ProvisionedWorkspaceCommandOptions & {
    rollback?: boolean;
  };

const RECORD_PAGE_FIELD_NAMES = [
  'source',
  'loggedBy',
  'cc',
  'bcc',
  'trackEnabled',
  'firstOpenedAt',
  'lastOpenedAt',
  'lastClickedAt',
  'repliedAt',
  'deliveryError',
] as const;

const SEED_UNIVERSAL_IDENTIFIERS = RECORD_PAGE_FIELD_NAMES.map(
  (fieldName) =>
    STANDARD_OBJECTS.email.views.emailRecordPageFields.viewFields[fieldName]
      .universalIdentifier,
);

const TRACKING_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS = [
  EMAIL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS.emailOpened,
  EMAIL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS.emailLinkClicked,
];

@RegisteredWorkspaceCommand('2.49.0', 1795091235333)
@Command({
  name: 'upgrade:2-49:provision-email-record-page-fields',
  description:
    'Show the Source, Logged by, CC, BCC, tracking and Delivery error fields on the Email record page, and name the sender on CRM-sent emails and the prospect on tracking timeline rows. Pass --rollback to remove the record page fields.',
})
export class ProvisionEmailRecordPageFieldsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionEmailRecordPageFieldsCommandOptions> {
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
    dataSource,
    options,
  }: RunOnWorkspaceArgs<ProvisionEmailRecordPageFieldsCommandOptions>): Promise<void> {
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

    if (!isRollback && !dryRun && isDefined(dataSource)) {
      await this.backfillNames(workspaceId, dataSource);
    }

    if (!isRollback && (dryRun || additionCount === 0)) {
      this.logger.log(
        `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${additionCount} email record page standard addition(s)`,
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
        `Email record page fields ${isRollback ? 'rollback' : 'provisioning'} failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `Workspace ${workspaceId}: ${isRollback ? 'email record page fields rolled back' : `${additionCount} email record page standard addition(s)`}`,
    );
  }

  // Rows written before names were stored: CRM-sent emails by "Email", tracking rows by nobody
  private async backfillNames(workspaceId: string, dataSource: DataSource) {
    const schemaName = getWorkspaceSchemaName(workspaceId);

    await dataSource.query(
      `UPDATE "${schemaName}"."email" email
      SET "createdByName" = NULLIF(btrim(concat_ws(' ', member."nameFirstName", member."nameLastName")), '')
      FROM "${schemaName}"."workspaceMember" member
      WHERE member.id = email."loggedById" AND email."createdByName" IN ('Email', 'Twenty')`,
    );

    const firstName = (column: string) =>
      `btrim(CASE WHEN split_part(${column}, ',', 1) LIKE '%<%'
        THEN replace(split_part(split_part(${column}, ',', 1), '<', 1), '"', '')
        ELSE split_part(${column}, ',', 1) END)`;

    await dataSource.query(
      `UPDATE "${schemaName}"."timelineActivity" activity
      SET properties = COALESCE(activity.properties, '{}'::jsonb) || jsonb_build_object('actorName',
        CASE WHEN activity."timelineActivityTypeSnapshot"->>'universalIdentifier' = ANY($1::text[])
          THEN ${firstName('email."to"')} ELSE ${firstName('email."from"')} END)
      FROM "${schemaName}"."email" email
      WHERE email.id = activity."linkedRecordId"
        AND activity."timelineActivityTypeSnapshot"->>'universalIdentifier' = ANY($2::text[])
        AND NOT (COALESCE(activity.properties, '{}'::jsonb) ? 'actorName')`,
      [
        TRACKING_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS,
        [
          ...TRACKING_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS,
          EMAIL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS.emailReplied,
        ],
      ],
    );
  }
}
