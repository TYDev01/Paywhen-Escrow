import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentsService } from "../payments/payments.service";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Liveness/readiness and integration status" })
  async health() {
    let database = "down";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      database = "down";
    }
    const payments = this.payments.capabilities();
    return {
      status: database === "up" ? "ok" : "degraded",
      time: new Date().toISOString(),
      services: {
        database,
        payments: {
          provider: payments.provider,
          liveMoneyMovementEnabled: payments.liveMoneyMovementEnabled,
        },
      },
    };
  }
}
