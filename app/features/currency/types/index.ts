/**
 * Currency system types
 */

/**
 * Currency configuration
 */
export interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number; // Relative to base currency
  decimalPrecision: number;
  thousandSeparator: string;
  decimalSeparator: string;
  symbolPosition: 'before' | 'after';
  isActive: boolean;
  isDefault: boolean;
}

/**
 * Exchange rate update
 */
export interface ExchangeRateUpdate {
  id: string;
  currencyCode: string;
  rate: number;
  source: string;
  timestamp: string;
}

/**
 * Currency conversion request
 */
export interface CurrencyConversionRequest {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

/**
 * Currency conversion result
 */
export interface CurrencyConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  timestamp: string;
}

/**
 * Price with currency information
 */
export interface PriceWithCurrency {
  amount: number;
  currencyCode: string;
  formatted: string;
}

/**
 * Regional price adjustment
 */
export interface RegionalPriceAdjustment {
  id: string;
  currencyCode: string;
  productId?: string;
  categoryId?: string;
  adjustmentType: 'percentage' | 'fixed';
  adjustmentValue: number;
  priority: number;
  isActive: boolean;
}

/**
 * Currency display options for the UI
 */
export interface CurrencyDisplayOptions {
  showCurrencyCode: boolean;
  showCurrencySymbol: boolean;
  alwaysShowDecimals: boolean;
  useGrouping: boolean;
}

/**
 * Exchange rate provider type
 */
export type ExchangeRateProviderType = 'manual' | 'openexchangerates' | 'currencylayer' | 'fixer';

/**
 * Exchange rate provider configuration
 */
export interface ExchangeRateProviderConfig {
  id: string;
  type: ExchangeRateProviderType;
  name: string;
  apiKey?: string;
  baseCurrency: string;
  updateFrequency: 'daily' | 'hourly' | 'manual';
  lastUpdated?: string;
  isActive: boolean;
}

/**
 * Currency formatting options
 */
export interface CurrencyFormatOptions {
  style: 'currency' | 'decimal';
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  compactDisplay?: 'short' | 'long';
}
