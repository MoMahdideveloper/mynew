import { Currency } from "@/types";

const USD_RATE: Record<Currency, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0071,
};

const DEFAULT_FRACTIONS: Record<Currency, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
};

export const supportedCurrencies = Object.keys(USD_RATE) as Currency[];

export function normalizeAmount(value: number, currency: Currency = "USD") {
  const fractionDigits = DEFAULT_FRACTIONS[currency] ?? 2;
  const factor = 10 ** fractionDigits;
  return Math.round(value * factor) / factor;
}

export function convertToUSD(amount: number, currency: Currency): number {
  const rate = USD_RATE[currency];
  if (!rate) {
    return normalizeAmount(amount, "USD");
  }
  return normalizeAmount(amount * rate, "USD");
}

export function convertFromUSD(amount: number, currency: Currency): number {
  const rate = USD_RATE[currency];
  if (!rate) {
    return normalizeAmount(amount, "USD");
  }
  return normalizeAmount(amount / rate, currency);
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
): number {
  if (from === to) return normalizeAmount(amount, to);
  if (to === "USD") {
    return convertToUSD(amount, from);
  }
  const usdAmount = convertToUSD(amount, from);
  return convertFromUSD(usdAmount, to);
}

export function formatCurrency(amount: number, currency: Currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: DEFAULT_FRACTIONS[currency] ?? 2,
  }).format(amount);
}

export function parseAmountInput(value: string): number | null {
  if (!value) return null;
  const numeric = Number.parseFloat(value.replace(/[^0-9.-]+/g, ""));
  return Number.isNaN(numeric) ? null : numeric;
}
