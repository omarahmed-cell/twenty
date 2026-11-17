import { Module } from '@nestjs/common';

import { PipelineModule } from 'src/modules/pipeline/pipeline.module';
import { PropertyCreationListener } from 'src/modules/properties/listeners/property-creation.listener';
import { PROPERTY_QUERY_HOOKS } from 'src/modules/properties/query-hooks/property-query-hooks.constant';
import { PropertyLogicResolver } from 'src/modules/properties/resolvers/property-logic.resolver';
import { PropertyLogicConfigService } from 'src/modules/properties/services/property-logic-config.service';
import { PropertyLogicEnforcementService } from 'src/modules/properties/services/property-logic-enforcement.service';
import { PropertySettingsWriteService } from 'src/modules/properties/services/property-settings-write.service';

@Module({
  imports: [PipelineModule],
  providers: [
    PropertyLogicConfigService,
    PropertyLogicEnforcementService,
    PropertySettingsWriteService,
    PropertyCreationListener,
    PropertyLogicResolver,
    ...PROPERTY_QUERY_HOOKS,
  ],
})
export class PropertiesModule {}
