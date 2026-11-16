import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { TransactionsService } from "./transactions.service";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";

@ApiTags("transactions")
@ApiBearerAuth()
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  @RequirePermissions("transaction:read:own")
  @ApiQuery({ name: "state", required: false })
  @ApiOperation({ summary: "List the caller's transactions (dashboard data)" })
  list(@CurrentUser() user: AuthUser, @Query("state") state?: string) {
    return this.transactions.listForUser(user.id, state);
  }

  @Get(":id")
  @RequirePermissions("transaction:read:own")
  @ApiOperation({ summary: "Transaction detail with state history" })
  detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.transactions.getForUser(id, user.id);
  }

  @Post(":id/fund")
  @RequirePermissions("transaction:fund")
  @ApiOperation({ summary: "Begin funding (returns configuration-required when no provider)" })
  fund(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.transactions.requestFunding(id, user);
  }
}
