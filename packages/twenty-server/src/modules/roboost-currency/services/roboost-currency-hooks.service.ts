import { Injectable, Logger } from '@nestjs/common';

type CurrenciesChangedHandler = (workspaceId: string) => Promise<void>;
type RatesChangedHandler = (
  workspaceId: string,
  options: { includeClosed: boolean },
) => Promise<void>;

// Deals and products react to currency changes; they register here so the currency module needs no import of them
@Injectable()
export class RoboostCurrencyHooksService {
  private readonly logger = new Logger(RoboostCurrencyHooksService.name);
  private readonly currencyHandlers: CurrenciesChangedHandler[] = [];
  private readonly rateHandlers: RatesChangedHandler[] = [];

  onCurrenciesChanged(handler: CurrenciesChangedHandler) {
    this.currencyHandlers.push(handler);
  }

  onRatesChanged(handler: RatesChangedHandler) {
    this.rateHandlers.push(handler);
  }

  async currenciesChanged(workspaceId: string) {
    for (const handler of this.currencyHandlers) {
      await handler(workspaceId).catch((error: Error) =>
        this.logger.error(
          `Workspace ${workspaceId}: currency change handler failed: ${error.message}`,
        ),
      );
    }
  }

  async ratesChanged(workspaceId: string, { includeClosed = false } = {}) {
    for (const handler of this.rateHandlers) {
      await handler(workspaceId, { includeClosed }).catch((error: Error) =>
        this.logger.error(
          `Workspace ${workspaceId}: rate change handler failed: ${error.message}`,
        ),
      );
    }
  }
}
