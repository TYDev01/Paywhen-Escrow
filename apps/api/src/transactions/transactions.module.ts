import { Module } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { TransactionsController } from "./transactions.controller";
import { PaymentsModule } from "../payments/payments.module";
import { LedgerModule } from "../ledger/ledger.module";

@Module({
  imports: [PaymentsModule, LedgerModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
