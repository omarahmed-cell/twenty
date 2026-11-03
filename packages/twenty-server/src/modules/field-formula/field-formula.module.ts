import { Module } from '@nestjs/common';

import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { FieldFormulaJob } from 'src/modules/field-formula/jobs/field-formula.job';
import { FieldFormulaMetadataListener } from 'src/modules/field-formula/listeners/field-formula-metadata.listener';
import { FieldFormulaRecordListener } from 'src/modules/field-formula/listeners/field-formula-record.listener';
import { FieldFormulaResolver } from 'src/modules/field-formula/resolvers/field-formula.resolver';
import { FieldFormulaService } from 'src/modules/field-formula/services/field-formula.service';

@Module({
  imports: [WorkspaceCacheModule, FieldMetadataModule, PermissionsModule],
  providers: [
    FieldFormulaService,
    FieldFormulaJob,
    FieldFormulaRecordListener,
    FieldFormulaMetadataListener,
    FieldFormulaResolver,
  ],
})
export class FieldFormulaModule {}
