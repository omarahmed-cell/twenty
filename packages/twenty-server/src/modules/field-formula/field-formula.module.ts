import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { FieldFormulaTimeBasedCronCommand } from 'src/modules/field-formula/crons/commands/field-formula-time-based.cron.command';
import { FieldFormulaTimeBasedCronJob } from 'src/modules/field-formula/crons/jobs/field-formula-time-based.cron.job';
import { FieldFormulaJob } from 'src/modules/field-formula/jobs/field-formula.job';
import { FieldFormulaMetadataListener } from 'src/modules/field-formula/listeners/field-formula-metadata.listener';
import { FieldFormulaRecordListener } from 'src/modules/field-formula/listeners/field-formula-record.listener';
import { FieldFormulaResolver } from 'src/modules/field-formula/resolvers/field-formula.resolver';
import { FieldFormulaService } from 'src/modules/field-formula/services/field-formula.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity]),
    WorkspaceCacheModule,
    FieldMetadataModule,
    PermissionsModule,
  ],
  providers: [
    FieldFormulaService,
    FieldFormulaJob,
    FieldFormulaTimeBasedCronJob,
    FieldFormulaTimeBasedCronCommand,
    FieldFormulaRecordListener,
    FieldFormulaMetadataListener,
    FieldFormulaResolver,
  ],
  exports: [FieldFormulaTimeBasedCronCommand],
})
export class FieldFormulaModule {}
