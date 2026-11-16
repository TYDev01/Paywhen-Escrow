/**
 * money.ts — currency-safe arithmetic.
 *
 * Money is stored and computed as an INTEGER number of minor units (e.g. cents)
 * using `bigint`. Floating-point numbers are NEVER used for monetary values.
 * This mirrors how amounts are persisted in the ledger (BIGINT columns).
 */

/** Supported currencies and their minor-unit exponent (decimal places). */
export const CURRENCIES = {
  USD: { code: "USD", minorUnits: 2, symbol: "$" },
  EUR: { code: "EUR", minorUnits: 2, symbol: "€" },
  GBP: { code: "GBP", minorUnits: 2, symbol: "£" },
  NGN: { code: "NGN", minorUnits: 2, symbol: "₦" },
  JPY: { code: "JPY", minorUnits: 0, symbol: "¥" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export function isCurrencyCode(value: string): value is CurrencyCode {
  return Object.prototype.hasOwnProperty.call(CURRENCIES, value);
}

/** An amount of money: integer minor units + an ISO currency code. */
export interface Money {
  /** Integer minor units (e.g. cents). Always a whole bigint. */
  readonly amount: bigint;
  readonly currency: CurrencyCode;
}

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

/** Construct Money from an integer number of minor units. */
export function money(minorUnits: bigint | number, currency: CurrencyCode): Money {
  if (!isCurrencyCode(currency)) {
    throw new MoneyError(`Unknown currency: ${String(currency)}`);
  }
  let amount: bigint;
  if (typeof minorUnits === "number") {
    if (!Number.isInteger(minorUnits)) {
      throw new MoneyError(`Minor units must be an integer, received ${minorUnits}`);
    }
    amount = BigInt(minorUnits);
  } else {
    amount = minorUnits;
  }
  return { amount, currency };
}

/**
 * Parse a human decimal string ("12.34") into Money. Rejects values with more
 * fractional digits than the currency allows — we never silently round input.
 */
export function moneyFromDecimalString(value: string, currency: CurrencyCode): Money {
  if (!isCurrencyCode(currency)) {
    throw new MoneyError(`Unknown currency: ${String(currency)}`);
  }
  const trimmed = value.trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(trimmed);
  if (!match) {
    throw new MoneyError(`Invalid money string: "${value}"`);
  }
  const sign = match[1] === "-" ? -1n : 1n;
  const whole = match[2] ?? "0";
  const fraction = match[3] ?? "";
  const exponent = CURRENCIES[currency].minorUnits;
  if (fraction.length > exponent) {
    throw new MoneyError(
      `Too many fractional digits for ${currency} (max ${exponent}): "${value}"`,
    );
  }
  const paddedFraction = fraction.padEnd(exponent, "0");
  const minor = BigInt(whole) * 10n ** BigInt(exponent) + BigInt(paddedFraction || "0");
  return { amount: sign * minor, currency };
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new MoneyError(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amount: a.amount - b.amount, currency: a.currency };
}

/** Multiply money by a whole integer factor (e.g. quantity). */
export function multiply(a: Money, factor: bigint | number): Money {
  const f = typeof factor === "number" ? BigInt(assertInt(factor)) : factor;
  return { amount: a.amount * f, currency: a.currency };
}

function assertInt(n: number): number {
  if (!Number.isInteger(n)) throw new MoneyError(`Expected integer, received ${n}`);
  return n;
}

export function isZero(a: Money): boolean {
  return a.amount === 0n;
}

export function isNegative(a: Money): boolean {
  return a.amount < 0n;
}

export function isPositive(a: Money): boolean {
  return a.amount > 0n;
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  if (a.amount < b.amount) return -1;
  if (a.amount > b.amount) return 1;
  return 0;
}

export function equals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.amount === b.amount;
}

/**
 * Apply a basis-point rate (1 bps = 0.01%) to an amount, rounding half-up.
 * Used for percentage fees. Keeps everything in integer space.
 */
export function applyBasisPoints(a: Money, bps: number): Money {
  if (!Number.isInteger(bps) || bps < 0) {
    throw new MoneyError(`Basis points must be a non-negative integer, received ${bps}`);
  }
  const numerator = a.amount * BigInt(bps);
  const denominator = 10_000n;
  return { amount: divRoundHalfUp(numerator, denominator), currency: a.currency };
}

/** Integer division rounding half away from zero. */
export function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new MoneyError("Division by zero");
  const sign = numerator < 0n !== denominator < 0n ? -1n : 1n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const quotient = n / d;
  const remainder = n % d;
  const rounded = remainder * 2n >= d ? quotient + 1n : quotient;
  return sign * rounded;
}

/**
 * Allocate an amount across N ratios without losing or creating minor units.
 * Any rounding remainder is distributed one unit at a time to the first
 * buckets — guaranteeing the parts sum back to the original exactly.
 */
export function allocate(a: Money, ratios: number[]): Money[] {
  if (ratios.length === 0) throw new MoneyError("allocate requires at least one ratio");
  if (ratios.some((r) => r < 0 || !Number.isInteger(r))) {
    throw new MoneyError("allocate ratios must be non-negative integers");
  }
  const total = ratios.reduce((s, r) => s + r, 0);
  if (total === 0) throw new MoneyError("allocate ratios must sum to a positive value");

  const totalBig = BigInt(total);
  let remainder = a.amount;
  const parts: bigint[] = [];
  for (const ratio of ratios) {
    const share = (a.amount * BigInt(ratio)) / totalBig;
    parts.push(share);
    remainder -= share;
  }
  // distribute the leftover units deterministically
  let i = 0;
  const step = remainder >= 0n ? 1n : -1n;
  let left = remainder < 0n ? -remainder : remainder;
  while (left > 0n) {
    parts[i % parts.length] = (parts[i % parts.length] ?? 0n) + step;
    left -= 1n;
    i += 1;
  }
  return parts.map((amount) => ({ amount, currency: a.currency }));
}

/** Format Money as a human string, e.g. "$1,234.50". Display only. */
export function formatMoney(a: Money, locale = "en-US"): string {
  const { minorUnits } = CURRENCIES[a.currency];
  const negative = a.amount < 0n;
  const abs = negative ? -a.amount : a.amount;
  const divisor = 10n ** BigInt(minorUnits);
  const whole = abs / divisor;
  const fraction = abs % divisor;
  const wholeStr = new Intl.NumberFormat(locale).format(whole);
  const fractionStr =
    minorUnits > 0 ? "." + fraction.toString().padStart(minorUnits, "0") : "";
  return `${negative ? "-" : ""}${CURRENCIES[a.currency].symbol}${wholeStr}${fractionStr}`;
}

/** Serialize for transport/persistence — amount as a decimal string of minor units. */
export function serializeMoney(a: Money): { amount: string; currency: CurrencyCode } {
  return { amount: a.amount.toString(), currency: a.currency };
}

export function deserializeMoney(input: { amount: string; currency: string }): Money {
  if (!isCurrencyCode(input.currency)) {
    throw new MoneyError(`Unknown currency: ${input.currency}`);
  }
  return { amount: BigInt(input.amount), currency: input.currency };
}
