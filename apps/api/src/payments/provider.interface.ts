/**
 * The payment-provider integration boundary.
 *
 * The platform NEVER infers funding from a browser redirect. A payment is only
 * considered funded after a verified, signature-checked provider event is
 * processed server-side and the ledger is posted.
 *
 * When no suitable, legally-approved provider is configured, live funding,
 * payouts and refunds are DISABLED and the API returns a truthful
 * configuration-required state instead of simulating success.
 */

export interface ProviderCapabilities {
  readonly configured: boolean;
  readonly liveMoneyMovementEnabled: boolean;
  readonly provider: string;
  /** Human-readable reason shown to operators when disabled. */
  readonly reason?: string;
}

export interface CreatePaymentInput {
  readonly transactionId: string;
  readonly amountMinor: bigint;
  readonly currency: string;
  readonly idempotencyKey: string;
}

export interface CreatePaymentResult {
  readonly providerRef: string;
  readonly clientSecret?: string;
  readonly status: "REQUIRES_PAYMENT" | "PROCESSING";
}

export interface VerifiedEvent {
  readonly eventId: string;
  readonly type: string;
  readonly providerRef: string;
  readonly amountMinor: bigint;
  readonly currency: string;
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(
      `Payment provider "${provider}" is not configured. Live funding, payouts and ` +
        `refunds are disabled until an approved provider and fund-safeguarding ` +
        `arrangement are set up.`,
    );
    this.name = "ProviderNotConfiguredError";
  }
}

export interface PaymentProvider {
  capabilities(): ProviderCapabilities;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /** Verify a webhook signature and parse into a normalized event. Throws if invalid. */
  verifyWebhook(rawBody: Buffer, signature: string | undefined): VerifiedEvent;
  createPayout(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  createRefund(input: CreatePaymentInput): Promise<CreatePaymentResult>;
}

export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");
