import {
  PaymentProvider,
  ProviderCapabilities,
  ProviderNotConfiguredError,
  CreatePaymentInput,
  CreatePaymentResult,
  VerifiedEvent,
} from "./provider.interface";

/**
 * The default provider when PAYMENTS_PROVIDER=none.
 *
 * It deliberately performs NO money movement. Every money-moving call throws
 * ProviderNotConfiguredError so the system can surface a truthful
 * "configuration required" state. This is the honest default the spec requires:
 * no fake wallet, no simulated funding.
 */
export class NoneProvider implements PaymentProvider {
  capabilities(): ProviderCapabilities {
    return {
      configured: false,
      liveMoneyMovementEnabled: false,
      provider: "none",
      reason:
        "No approved payment provider or fund-safeguarding arrangement is configured. " +
        "Funding, payouts and refunds are disabled.",
    };
  }

  createPayment(_input: CreatePaymentInput): Promise<CreatePaymentResult> {
    throw new ProviderNotConfiguredError("none");
  }

  verifyWebhook(_rawBody: Buffer, _signature: string | undefined): VerifiedEvent {
    throw new ProviderNotConfiguredError("none");
  }

  createPayout(_input: CreatePaymentInput): Promise<CreatePaymentResult> {
    throw new ProviderNotConfiguredError("none");
  }

  createRefund(_input: CreatePaymentInput): Promise<CreatePaymentResult> {
    throw new ProviderNotConfiguredError("none");
  }
}
