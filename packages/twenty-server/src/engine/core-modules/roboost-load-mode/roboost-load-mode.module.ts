import { Global, Module } from '@nestjs/common';

import { RoboostLoadModeService } from 'src/engine/core-modules/roboost-load-mode/roboost-load-mode.service';

@Global()
@Module({
  providers: [RoboostLoadModeService],
  exports: [RoboostLoadModeService],
})
export class RoboostLoadModeModule {}
