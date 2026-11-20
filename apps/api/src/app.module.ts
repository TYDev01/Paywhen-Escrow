import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { JwtModule } from "@nestjs/jwt";
import { validateEnv } from "./config/env";
import { PrismaModule } from "./prisma/prisma.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { AgreementsModule } from "./agreements/agreements.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { DisputesModule } from "./disputes/disputes.module";
import { MilestonesModule } from "./milestones/milestones.module";
import { SupportModule } from "./support/support.module";
import { PaymentsModule } from "./payments/payments.module";
import { LedgerModule } from "./ledger/ledger.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    JwtModule.register({ global: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AgreementsModule,
    TransactionsModule,
    DisputesModule,
    MilestonesModule,
    SupportModule,
    PaymentsModule,
    LedgerModule,
    HealthModule,
  ],
  providers: [
    // Order matters: authenticate first, then rate-limit, then authorize.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
