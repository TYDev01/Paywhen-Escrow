import { Controller, Param, Post } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { MilestonesService } from "./milestones.service";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";

// Party authorization is enforced in the service, so no extra permission here.
@ApiTags("milestones")
@ApiBearerAuth()
@Controller("milestones")
export class MilestonesController {
  constructor(private readonly milestones: MilestonesService) {}

  @Post(":id/advance")
  @ApiOperation({ summary: "Advance a milestone (seller delivers, then buyer releases)" })
  advance(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.milestones.advance(id, user.id);
  }
}
