/**
 * Currency Conversion Utilities
 * Handles conversion between EUR/USD and HUF using fixed trip rates
 */

import { Decimal } from 'decimal.js'

export type CurrencyCode = 'HUF' | 'EUR' | 'USD' | 'HRK'

export interface ExchangeRates {
  rateEurToHuf: number
  rateUsdToHuf: number
  rateHrkToHuf: number
}

/**
 * Convert any currency to HUF using trip's fixed exchange rates
 */
export function convertToHuf(
  amount: number | string | Decimal,
  currency: CurrencyCode,
  rates: ExchangeRates
): Decimal {
  const amt = new Decimal(amount)

  if (currency === 'HUF') {
    return amt
  }

  if (currency === 'EUR') {
    return amt.mul(rates.rateEurToHuf)
  }

  if (currency === 'USD') {
    return amt.mul(rates.rateUsdToHuf)
  }

  if (currency === 'HRK') {
    return amt.mul(rates.rateHrkToHuf)
  }

  throw new Error(`Invalid currency: ${currency}`)
}

/**
 * Convert HUF back to original currency (inverse calculation)
 */
export function convertFromHuf(
  amountHuf: number | string | Decimal,
  currency: CurrencyCode,
  rates: ExchangeRates
): Decimal {
  const amt = new Decimal(amountHuf)

  if (currency === 'HUF') {
    return amt
  }

  if (currency === 'EUR') {
    return amt.div(rates.rateEurToHuf)
  }

  if (currency === 'USD') {
    return amt.div(rates.rateUsdToHuf)
  }

  if (currency === 'HRK') {
    return amt.div(rates.rateHrkToHuf)
  }

  throw new Error(`Invalid currency: ${currency}`)
}

/**
 * Format currency for display
 * HUF: "123,456 Ft"
 * EUR: "€123"
 * USD: "$123"
 * HRK: "123 kn"
 */
export function formatCurrency(
  amount: number | string | Decimal,
  currency: CurrencyCode,
  options: { decimals?: boolean } = {}
): string {
  const { decimals = false } = options
  const amt = new Decimal(amount)

  const symbols: Record<CurrencyCode, string> = {
    HUF: 'Ft',
    EUR: '€',
    USD: '$',
    HRK: 'kn',
  }

  const formatted = decimals ? amt.toFixed(2) : amt.toFixed(0)
  const withCommas = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  // HUF and HRK go after the number
  if (currency === 'HUF' || currency === 'HRK') {
    return `${withCommas} ${symbols[currency]}`
  }

  // EUR and USD go before
  return `${symbols[currency]}${withCommas}`
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  const symbols: Record<CurrencyCode, string> = {
    HUF: 'Ft',
    EUR: '€',
    USD: '$',
    HRK: 'kn',
  }
  return symbols[currency]
}

/**
 * Parse a currency string back to a number
 * Removes commas and currency symbols
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '')
  return parseFloat(cleaned) || 0
}
