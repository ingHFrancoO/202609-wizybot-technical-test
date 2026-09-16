import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { AppConfig } from '../config/configuration.js';
import { ConvertCurrencyResultDto } from './dto/convert-currency-result.dto.js';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour: exchange rates don't need to be fresher than this.
const OPEN_EXCHANGE_RATES_URL = 'https://openexchangerates.org/api/latest.json';

interface LatestRatesResponse {
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

interface RatesCacheEntry {
  rates: Record<string, number>;
  timestamp: number;
  expiresAt: number;
}

/** Raised for anything conversion-related the caller should be told about (never a 500). */
export class CurrencyConversionError extends Error {}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private cache: RatesCacheEntry | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  /**
   * Converts `amount` from one ISO 4217 currency code to another using the
   * latest exchange rates. The Open Exchange Rates free plan only exposes
   * USD-based rates, so any pair is computed as a cross-rate through USD.
   */
  async convert(amount: number, from: string, to: string): Promise<ConvertCurrencyResultDto> {
    const fromCode = from.trim().toUpperCase();
    const toCode = to.trim().toUpperCase();

    const { rates, timestamp } = await this.getLatestRates();

    const rateFrom = fromCode === 'USD' ? 1 : rates[fromCode];
    const rateTo = toCode === 'USD' ? 1 : rates[toCode];

    if (!rateFrom) {
      throw new CurrencyConversionError(`Unsupported currency code: ${fromCode}`);
    }
    if (!rateTo) {
      throw new CurrencyConversionError(`Unsupported currency code: ${toCode}`);
    }

    const amountInUsd = amount / rateFrom;
    const convertedAmount = amountInUsd * rateTo;

    return {
      amount,
      from: fromCode,
      to: toCode,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      rateTimestamp: new Date(timestamp * 1000).toISOString(),
    };
  }

  private async getLatestRates(): Promise<{ rates: Record<string, number>; timestamp: number }> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache;
    }

    const { appId } = this.configService.get('openExchangeRates', { infer: true });

    try {
      const response = await firstValueFrom(
        this.httpService.get<LatestRatesResponse>(OPEN_EXCHANGE_RATES_URL, {
          params: { app_id: appId },
        }),
      );

      this.cache = {
        rates: response.data.rates,
        timestamp: response.data.timestamp,
        expiresAt: now + CACHE_TTL_MS,
      };

      return this.cache;
    } catch (error) {
      this.logger.error('Failed to fetch exchange rates', error instanceof Error ? error.stack : error);
      throw new CurrencyConversionError('Could not retrieve the latest exchange rates');
    }
  }
}
