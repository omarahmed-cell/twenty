import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SecretEncryptionModule } from 'src/engine/core-modules/secret-encryption/secret-encryption.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RoboostUpdateExchangeRatesCommand } from 'src/modules/roboost-currency/commands/roboost-update-exchange-rates.command';
import { RoboostExchangeRatesCronCommand } from 'src/modules/roboost-currency/crons/commands/roboost-exchange-rates.cron.command';
import { RoboostExchangeRatesCronJob } from 'src/modules/roboost-currency/crons/jobs/roboost-exchange-rates.cron.job';
import { RoboostCurrencyResolver } from 'src/modules/roboost-currency/resolvers/roboost-currency.resolver';
import { RoboostCurrencyHooksService } from 'src/modules/roboost-currency/services/roboost-currency-hooks.service';
import { RoboostCurrencyService } from 'src/modules/roboost-currency/services/roboost-currency.service';
import { RoboostExchangeRateProviderService } from 'src/modules/roboost-currency/services/roboost-exchange-rate-provider.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity]),
    SecretEncryptionModule,
  ],
  providers: [
    RoboostCurrencyService,
    RoboostCurrencyHooksService,
    RoboostExchangeRateProviderService,
    RoboostCurrencyResolver,
    RoboostExchangeRatesCronJob,
    RoboostExchangeRatesCronCommand,
    RoboostUpdateExchangeRatesCommand,
  ],
  exports: [
    RoboostCurrencyService,
    RoboostCurrencyHooksService,
    RoboostExchangeRatesCronCommand,
    RoboostUpdateExchangeRatesCommand,
  ],
})
export class RoboostCurrencyModule {}
