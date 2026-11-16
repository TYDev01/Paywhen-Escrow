import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  PAYMENT_PROVIDER,
  PaymentProvider,
  ProviderCapabilities,
} from "./provider.interface";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(@Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider) {}

  capabilities(): ProviderCapabilities {
    return this.provider.capabilities();
  }

  get isLiveEnabled(): boolean {
    return this.provider.capabilities().liveMoneyMovementEnabled;
  }

  /** Expose the provider for the transactions service (funding flow). */
  getProvider(): PaymentProvider {
    return this.provider;
  }
}
