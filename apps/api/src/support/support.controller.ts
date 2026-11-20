import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SupportService } from "./support.service";
import { CreateTicketDto, TicketMessageDto } from "./dto";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";

// Any authenticated user can raise and view their own support tickets, so these
// routes need no extra permission beyond authentication.
@ApiTags("support")
@ApiBearerAuth()
@Controller("support/tickets")
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get()
  @ApiOperation({ summary: "List the caller's support tickets" })
  list(@CurrentUser() user: AuthUser) {
    return this.support.listForUser(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Support ticket detail with its message thread" })
  detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.support.getForUser(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: "Open a new support ticket" })
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: AuthUser) {
    return this.support.create(user.id, dto);
  }

  @Post(":id/messages")
  @ApiOperation({ summary: "Reply to a support ticket" })
  reply(@Param("id") id: string, @Body() dto: TicketMessageDto, @CurrentUser() user: AuthUser) {
    return this.support.reply(id, user.id, dto);
  }
}
