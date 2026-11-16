import { Body, Controller, Post, Req, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, RefreshDto } from "./dto";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private meta(req: Request) {
    return {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    };
  }

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Create a new account" })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.auth.register(dto, this.meta(req));
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Authenticate and receive tokens" })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, this.meta(req));
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Rotate refresh token for a new access token" })
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, this.meta(req));
  }

  @Public()
  @Post("logout")
  @HttpCode(204)
  @ApiOperation({ summary: "Revoke a refresh session" })
  async logout(@Body() dto: RefreshDto) {
    await this.auth.logout(dto.refreshToken);
  }
}
