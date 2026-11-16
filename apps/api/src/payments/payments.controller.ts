import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Get("capabilities")
  @ApiOperation({
    summary: "Report whether live money movement is configured and enabled",
  })
  capabilities() {
    // Truthful: the frontend uses this to render a configuration-required state
    // instead of a fake "funds secured" experience.
    return this.payments.capabilities();
  }
}
