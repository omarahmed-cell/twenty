import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

export type ExchangeRateFetchResult =
  | { ok: true; rates: Record<string, number>; timestamp: string }
  | { ok: false; error: string };

const OPEN_EXCHANGE_RATES_LATEST_URL =
  'https://openexchangerates.org/api/latest.json';
const TIMEOUT_MS = 20_000;

// Open Exchange Rates, base USD (the free plan only serves USD). The App ID never leaves this method.
@Injectable()
export class RoboostExchangeRateProviderService {
  async fetchLatest(appId: string): Promise<ExchangeRateFetchResult> {
    const url = `${OPEN_EXCHANGE_RATES_LATEST_URL}?app_id=${encodeURIComponent(appId)}&base=USD`;

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { Accept: 'application/json' },
      });
      const body = (await response.json().catch(() => ({}))) as {
        rates?: Record<string, number>;
        timestamp?: number;
        description?: string;
        message?: string;
      };

      if (!response.ok || !isDefined(body.rates)) {
        return {
          ok: false,
          error: `Open Exchange Rates answered ${response.status}: ${body.description ?? body.message ?? 'no rates'}`,
        };
      }

      return {
        ok: true,
        rates: body.rates,
        timestamp: isDefined(body.timestamp)
          ? new Date(body.timestamp * 1000).toISOString()
          : new Date().toISOString(),
      };
    } catch (error) {
      return {
        ok: false,
        error:
          `Could not reach Open Exchange Rates: ${(error as Error).message}`.replace(
            appId,
            '***',
          ),
      };
    }
  }
}
