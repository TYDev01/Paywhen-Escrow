import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AgreementsService } from "./agreements.service";
import { CreateAgreementDto } from "./dto";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";

@ApiTags("agreements")
@ApiBearerAuth()
@Controller("agreements")
export class AgreementsController {
  constructor(private readonly agreements: AgreementsService) {}

  @Post()
  @RequirePermissions("agreement:create")
  @ApiOperation({ summary: "Create an escrow agreement and its first version" })
  create(@Body() dto: CreateAgreementDto, @CurrentUser() user: AuthUser) {
    return this.agreements.create(dto, user);
  }

  @Post(":id/accept")
  @RequirePermissions("agreement:accept")
  @ApiOperation({ summary: "Accept the current agreement terms" })
  accept(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.agreements.accept(id, user);
  }

  @Post("claim/:reference")
  @RequirePermissions("agreement:accept")
  @ApiOperation({ summary: "Attach the caller as buyer to an open escrow by its payment ID" })
  claim(@Param("reference") reference: string, @CurrentUser() user: AuthUser) {
    return this.agreements.claim(reference, user);
  }
}
