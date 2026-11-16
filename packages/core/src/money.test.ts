import { describe, it, expect } from "vitest";
import {
  money,
  moneyFromDecimalString,
  add,
  subtract,
  multiply,
  applyBasisPoints,
  allocate,
  divRoundHalfUp,
  formatMoney,
  compare,
  equals,
  serializeMoney,
  deserializeMoney,
  MoneyError,
} from "./money.js";

describe("money construction", () => {
  it("rejects non-integer minor units", () => {
    expect(() => money(1.5, "USD")).toThrow(MoneyError);
  });

  it("parses decimal strings respecting currency precision", () => {
    expect(moneyFromDecimalString("12.34", "USD").amount).toBe(1234n);
    expect(moneyFromDecimalString("100", "USD").amount).toBe(10000n);
    expect(moneyFromDecimalString("-0.05", "USD").amount).toBe(-5n);
    expect(moneyFromDecimalString("500", "JPY").amount).toBe(500n);
  });

  it("rejects too many fractional digits", () => {
    expect(() => moneyFromDecimalString("12.345", "USD")).toThrow(MoneyError);
    expect(() => moneyFromDecimalString("12.3", "JPY")).toThrow(MoneyError);
  });
});

describe("arithmetic", () => {
  it("adds and subtracts same currency", () => {
    expect(add(money(1000, "USD"), money(250, "USD")).amount).toBe(1250n);
    expect(subtract(money(1000, "USD"), money(250, "USD")).amount).toBe(750n);
  });

  it("throws on currency mismatch", () => {
    expect(() => add(money(1, "USD"), money(1, "EUR"))).toThrow(MoneyError);
  });

  it("multiplies by integer factor", () => {
    expect(multiply(money(199, "USD"), 3).amount).toBe(597n);
  });
});

describe("rounding", () => {
  it("rounds half away from zero", () => {
    expect(divRoundHalfUp(5n, 2n)).toBe(3n);
    expect(divRoundHalfUp(-5n, 2n)).toBe(-3n);
    expect(divRoundHalfUp(4n, 2n)).toBe(2n);
    expect(divRoundHalfUp(1n, 3n)).toBe(0n);
  });

  it("applies basis points (2.9% of $100.00 = $2.90)", () => {
    expect(applyBasisPoints(money(10000, "USD"), 290).amount).toBe(290n);
  });

  it("rounds basis-point fees half up", () => {
    // 2.9% of $0.17 = 0.493c -> rounds to 0c; of $0.18 = 0.522c -> 1c
    expect(applyBasisPoints(money(17, "USD"), 290).amount).toBe(0n);
    expect(applyBasisPoints(money(18, "USD"), 290).amount).toBe(1n);
  });
});

describe("allocate", () => {
  it("splits without losing units", () => {
    const parts = allocate(money(1000, "USD"), [1, 1, 1]);
    expect(parts.map((p) => p.amount)).toEqual([334n, 333n, 333n]);
    const sum = parts.reduce((s, p) => s + p.amount, 0n);
    expect(sum).toBe(1000n);
  });

  it("respects weighted ratios and conserves total", () => {
    const parts = allocate(money(10001, "USD"), [7, 3]);
    const sum = parts.reduce((s, p) => s + p.amount, 0n);
    expect(sum).toBe(10001n);
  });
});

describe("compare / equals / serialize", () => {
  it("compares amounts", () => {
    expect(compare(money(1, "USD"), money(2, "USD"))).toBe(-1);
    expect(equals(money(2, "USD"), money(2, "USD"))).toBe(true);
    expect(equals(money(2, "USD"), money(2, "EUR"))).toBe(false);
  });

  it("round-trips serialization", () => {
    const m = money(123456789012345n, "USD");
    expect(deserializeMoney(serializeMoney(m))).toEqual(m);
  });
});

describe("formatMoney", () => {
  it("formats with symbol and precision", () => {
    expect(formatMoney(money(123450, "USD"))).toBe("$1,234.50");
    expect(formatMoney(money(-5, "USD"))).toBe("-$0.05");
    expect(formatMoney(money(500, "JPY"))).toBe("¥500");
  });
});
