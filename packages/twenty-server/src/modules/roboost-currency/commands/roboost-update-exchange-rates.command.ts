import { readFileSync } from 'fs';

import { Command, CommandRunner, Option } from 'nest-commander';

import { RoboostCurrencyService } from 'src/modules/roboost-currency/services/roboost-currency.service';

type UpdateExchangeRatesOptions = {
  workspaceId: string;
  ratesFile?: string;
  force?: boolean;
};

// Runs the scheduled update by hand; --rates-file stands in for the provider (USD-based JSON like {"SAR": 3.75})
@Command({
  name: 'roboost-currency:update-rates',
  description:
    'Run the exchange rate update for a workspace now. --force ignores the frequency; --rates-file uses rates from a JSON file instead of Open Exchange Rates',
})
export class RoboostUpdateExchangeRatesCommand extends CommandRunner {
  constructor(private readonly roboostCurrencyService: RoboostCurrencyService) {
    super();
  }

  @Option({ flags: '-w, --workspace-id <id>', required: true })
  parseWorkspaceId(value: string) {
    return value;
  }

  @Option({ flags: '--rates-file <path>' })
  parseRatesFile(value: string) {
    return value;
  }

  @Option({ flags: '--force' })
  parseForce() {
    return true;
  }

  async run(_: string[], options: UpdateExchangeRatesOptions): Promise<void> {
    const ratesOverride = options.ratesFile
      ? (JSON.parse(readFileSync(options.ratesFile, 'utf-8')) as Record<
          string,
          number
        >)
      : undefined;
    const run = await this.roboostCurrencyService.runScheduledUpdate(
      options.workspaceId,
      {
        force: options.force === true || ratesOverride !== undefined,
        retryDelaysMs: ratesOverride ? [] : undefined,
        ratesOverride,
      },
    );

    // oxlint-disable-next-line no-console
    console.log(JSON.stringify(run));
  }
}
