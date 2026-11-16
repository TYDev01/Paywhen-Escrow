import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PAYMENT_PROVIDER, PaymentProvider } from "./provider.interface";
import { NoneProvider } from "./none.provider";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): PaymentProvider => {
        const provider = config.get<string>("PAYMENTS_PROVIDER", "none");
        switch (provider) {
          // A real Stripe adapter would be constructed here once keys and an
          // approved fund-safeguarding arrangement are in place. Until then we
          // fall through to the honest NoneProvider.
          case "none":
          default:
            return new NoneProvider();
        }
      },
    },
  ],
  exports: [PaymentsService, PAYMENT_PROVIDER],
})
export class PaymentsModule {}
