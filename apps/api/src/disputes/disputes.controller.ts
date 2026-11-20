import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { DisputesService } from "./disputes.service";
import { OpenDisputeDto, DisputeMessageDto } from "./dto";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";

@ApiTags("disputes")
@ApiBearerAuth()
@Controller("disputes")
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Get()
  @RequirePermissions("transaction:read:own")
  @ApiOperation({ summary: "List disputes on the caller's transactions" })
  list(@CurrentUser() user: AuthUser) {
    return this.disputes.listForUser(user.id);
  }

  @Get(":id")
  @RequirePermissions("transaction:read:own")
  @ApiOperation({ summary: "Dispute detail with its message thread" })
  detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.disputes.getForUser(id, user.id);
  }

  @Post()
  @RequirePermissions("dispute:open")
  @ApiOperation({ summary: "Open a dispute on a transaction" })
  open(@Body() dto: OpenDisputeDto, @CurrentUser() user: AuthUser) {
    return this.disputes.open(user.id, dto);
  }

  @Post(":id/messages")
  @RequirePermissions("dispute:message")
  @ApiOperation({ summary: "Add a message to a dispute" })
  message(@Param("id") id: string, @Body() dto: DisputeMessageDto, @CurrentUser() user: AuthUser) {
    return this.disputes.addMessage(id, user.id, dto);
  }
}
