import { describe, it, expect } from "vitest";
import { assertBalanced, signedEffect, LedgerError, JournalEntry } from "./ledger.js";

const entry = (postings: JournalEntry["postings"]): JournalEntry => ({
  postings,
  reference: "test",
  idempotencyKey: "k1",
});

describe("assertBalanced", () => {
  it("accepts a balanced two-leg entry", () => {
    expect(() =>
      assertBalanced(
        entry([
          { accountId: "a", direction: "DEBIT", amount: 1000n, currency: "USD" },
          { accountId: "b", direction: "CREDIT", amount: 1000n, currency: "USD" },
        ]),
      ),
    ).not.toThrow();
  });

  it("rejects an unbalanced entry", () => {
    expect(() =>
      assertBalanced(
        entry([
          { accountId: "a", direction: "DEBIT", amount: 1000n, currency: "USD" },
          { accountId: "b", direction: "CREDIT", amount: 999n, currency: "USD" },
        ]),
      ),
    ).toThrow(LedgerError);
  });

  it("requires balance per currency", () => {
    expect(() =>
      assertBalanced(
        entry([
          { accountId: "a", direction: "DEBIT", amount: 1000n, currency: "USD" },
          { accountId: "b", direction: "CREDIT", amount: 1000n, currency: "USD" },
          { accountId: "c", direction: "DEBIT", amount: 500n, currency: "EUR" },
        ]),
      ),
    ).toThrow(LedgerError);
  });

  it("rejects non-positive amounts and single-leg entries", () => {
    expect(() =>
      assertBalanced(
        entry([{ accountId: "a", direction: "DEBIT", amount: 1n, currency: "USD" }]),
      ),
    ).toThrow(LedgerError);
    expect(() =>
      assertBalanced(
        entry([
          { accountId: "a", direction: "DEBIT", amount: 0n, currency: "USD" },
          { accountId: "b", direction: "CREDIT", amount: 0n, currency: "USD" },
        ]),
      ),
    ).toThrow(LedgerError);
  });
});

describe("signedEffect", () => {
  it("debit increases an asset, credit decreases it", () => {
    expect(
      signedEffect("ASSET", { accountId: "a", direction: "DEBIT", amount: 100n, currency: "USD" }),
    ).toBe(100n);
    expect(
      signedEffect("ASSET", { accountId: "a", direction: "CREDIT", amount: 100n, currency: "USD" }),
    ).toBe(-100n);
  });

  it("credit increases a liability", () => {
    expect(
      signedEffect("LIABILITY", {
        accountId: "a",
        direction: "CREDIT",
        amount: 100n,
        currency: "USD",
      }),
    ).toBe(100n);
  });
});
