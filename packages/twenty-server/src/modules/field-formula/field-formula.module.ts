import { Module } from '@nestjs/common';

import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { FieldFormulaJob } from 'src/modules/field-formula/jobs/field-formula.job';
import { FieldFormulaMetadataListener } from 'src/modules/field-formula/listeners/field-formula-metadata.listener';
import { FieldFormulaRecordListener } from 'src/modules/field-formula/listeners/field-formula-record.listener';
import { FieldFormulaService } from 'src/modules/field-formula/services/field-formula.service';

@Module({
  imports: [WorkspaceCacheModule],
  providers: [
    FieldFormulaService,
    FieldFormulaJob,
    FieldFormulaRecordListener,
    FieldFormulaMetadataListener,
  ],
})
export class FieldFormulaModule {}
