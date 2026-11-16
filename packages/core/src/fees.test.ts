import { describe, it, expect } from "vitest";
import { computeFees, FeeSchedule } from "./fees.js";
import { money, add } from "./money.js";

const base: Omit<FeeSchedule, "payer"> = {
  percentageBps: 100, // 1%
  fixedMinorUnits: 50n, // $0.50
};

describe("computeFees", () => {
  it("charges the buyer: buyer funds escrow + fee, seller nets full amount", () => {
    const b = computeFees(money(10000, "USD"), { ...base, payer: "BUYER" });
    expect(b.platformFee.amount).toBe(150n); // 1% of 10000 = 100, + 50
    expect(b.buyerTotal.amount).toBe(10150n);
    expect(b.sellerPayout.amount).toBe(10000n);
    expect(b.sellerFee.amount).toBe(0n);
  });

  it("charges the seller: buyer funds escrow, seller nets escrow - fee", () => {
    const s = computeFees(money(10000, "USD"), { ...base, payer: "SELLER" });
    expect(s.platformFee.amount).toBe(150n);
    expect(s.buyerTotal.amount).toBe(10000n);
    expect(s.sellerPayout.amount).toBe(9850n);
  });

  it("splits the fee so shares sum exactly to the total fee", () => {
    const sp = computeFees(money(10001, "USD"), { ...base, payer: "SPLIT" });
    const recombined = add(sp.buyerFee, sp.sellerFee);
    expect(recombined.amount).toBe(sp.platformFee.amount);
  });

  it("applies a minimum fee floor", () => {
    const f = computeFees(money(100, "USD"), {
      percentageBps: 100,
      fixedMinorUnits: 0n,
      payer: "BUYER",
      minMinorUnits: 100n,
    });
    expect(f.platformFee.amount).toBe(100n); // raw 1c floored to $1.00
  });

  it("applies a maximum fee ceiling", () => {
    const f = computeFees(money(1_000_000, "USD"), {
      percentageBps: 100,
      fixedMinorUnits: 0n,
      payer: "BUYER",
      maxMinorUnits: 500n,
    });
    expect(f.platformFee.amount).toBe(500n);
  });
});
