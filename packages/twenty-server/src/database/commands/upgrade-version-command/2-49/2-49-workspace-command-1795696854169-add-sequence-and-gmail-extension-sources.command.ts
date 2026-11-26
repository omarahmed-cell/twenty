import { Command } from 'nest-commander';
import { RECORD_SOURCE_OBJECT_NAMES } from 'twenty-shared/constants';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { buildRecordSourceSelectOptions } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-record-source-field-flat-metadata.util';

const NEW_ACTOR_SOURCE_VALUES = ['SEQUENCE', 'GMAIL_EXTENSION'];

// Enum names are truncated by Postgres, so actor source enums are found by their values
const ACTOR_SOURCE_MARKER_VALUES = [
  'MANUAL',
  'API',
  'IMPORT',
  'WEBHOOK',
  'APPLICATION',
];

type SelectOption = {
  id: string;
  value: string;
  label: string;
  position: number;
  color: string;
};

@RegisteredWorkspaceCommand('2.49.0', 1795696854169)
@Command({
  name: 'upgrade:2-49:add-sequence-and-gmail-extension-sources',
  description:
    'Add the Sequence and Gmail extension values to the Record source field of every object that has it, and to every actor source enum (createdBy, updatedBy and the like), so records from HubSpot sequences and the Gmail extension keep their source.',
})
export class AddSequenceAndGmailExtensionSourcesCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly fieldMetadataService: FieldMetadataService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace(args: RunOnWorkspaceArgs): Promise<void> {
    await this.up(args);
  }

  async up({ workspaceId, dataSource, options }: RunOnWorkspaceArgs) {
    if (!isDefined(dataSource)) {
      throw new Error(`Workspace ${workspaceId}: no data source`);
    }

    const dryRun = options.dryRun ?? false;
    const schemaName = getWorkspaceSchemaName(workspaceId);

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );
    const { flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatFieldMetadataMaps',
      ]);

    let updatedFieldCount = 0;

    for (const objectName of RECORD_SOURCE_OBJECT_NAMES) {
      const recordSourceField =
        findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
          flatEntityMaps: flatFieldMetadataMaps,
          universalIdentifier:
            STANDARD_OBJECTS[objectName].fields.recordSource
              .universalIdentifier,
        });

      if (!isDefined(recordSourceField)) {
        continue;
      }

      const existingOptions = (recordSourceField.options ??
        []) as SelectOption[];
      const existingValues = new Set(
        existingOptions.map((option) => option.value),
      );
      // Existing options keep their ids so stored values are untouched
      const missingOptions = buildRecordSourceSelectOptions(objectName).filter(
        (option) => !existingValues.has(option.value),
      );

      if (missingOptions.length === 0) {
        continue;
      }

      updatedFieldCount++;

      if (dryRun) {
        continue;
      }

      await this.fieldMetadataService.updateOneField({
        workspaceId,
        isSystemBuild: true,
        ownerFlatApplication: twentyStandardFlatApplication,
        updateFieldInput: {
          id: recordSourceField.id,
          options: [
            ...existingOptions,
            ...missingOptions.map((option, index) => ({
              ...option,
              position: existingOptions.length + index,
            })),
          ],
        },
      });
    }

    const actorSourceEnums: { typname: string }[] = await dataSource.query(
      `SELECT t.typname
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typtype = 'e'
        AND n.nspname = $1
        AND (
          SELECT array_agg(e.enumlabel::text)
          FROM pg_enum e
          WHERE e.enumtypid = t.oid
        ) @> $2::text[]
        AND NOT (
          SELECT array_agg(e.enumlabel::text)
          FROM pg_enum e
          WHERE e.enumtypid = t.oid
        ) @> $3::text[]`,
      [schemaName, ACTOR_SOURCE_MARKER_VALUES, NEW_ACTOR_SOURCE_VALUES],
    );

    if (!dryRun) {
      // ADD VALUE cannot run inside a transaction block on older Postgres, so each runs on its own
      for (const { typname } of actorSourceEnums) {
        for (const value of NEW_ACTOR_SOURCE_VALUES) {
          await dataSource.query(
            `ALTER TYPE "${schemaName}"."${typname}" ADD VALUE IF NOT EXISTS '${value}'`,
          );
        }
      }
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${updatedFieldCount} record source field(s) and ${actorSourceEnums.length} actor source enum(s) extended`,
    );
  }

  // Postgres cannot drop an enum value, and records may already use the new ones
  async down({ workspaceId }: RunOnWorkspaceArgs) {
    this.logger.log(
      `Workspace ${workspaceId}: Sequence and Gmail extension sources are kept, Postgres cannot drop enum values`,
    );
  }
}
