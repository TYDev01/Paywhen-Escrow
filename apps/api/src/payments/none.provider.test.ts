import { describe, it, expect } from "vitest";
import { NoneProvider } from "./none.provider";
import { ProviderNotConfiguredError } from "./provider.interface";

describe("NoneProvider (honest default)", () => {
  const provider = new NoneProvider();

  it("reports live money movement disabled", () => {
    const caps = provider.capabilities();
    expect(caps.configured).toBe(false);
    expect(caps.liveMoneyMovementEnabled).toBe(false);
    expect(caps.reason).toBeTruthy();
  });

  it("never simulates a payment — it throws", () => {
    expect(() =>
      provider.createPayment({
        transactionId: "t",
        amountMinor: 1000n,
        currency: "USD",
        idempotencyKey: "k",
      }),
    ).toThrow(ProviderNotConfiguredError);
  });

  it("refuses payouts and refunds", () => {
    const input = { transactionId: "t", amountMinor: 1n, currency: "USD", idempotencyKey: "k" };
    expect(() => provider.createPayout(input)).toThrow(ProviderNotConfiguredError);
    expect(() => provider.createRefund(input)).toThrow(ProviderNotConfiguredError);
  });

  it("rejects webhook verification when unconfigured", () => {
    expect(() => provider.verifyWebhook(Buffer.from(""), undefined)).toThrow(
      ProviderNotConfiguredError,
    );
  });
});
